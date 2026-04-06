import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MP_API = "https://api.mercadopago.com";

const STATUS_MAP: Record<string, string> = {
  approved: "approved",
  pending: "pending",
  in_process: "in_process",
  rejected: "rejected",
  cancelled: "cancelled",
  refunded: "refunded",
  charged_back: "refunded",
};

const INVOICE_STATUS_MAP: Record<string, string> = {
  approved: "paid",
  pending: "pending",
  in_process: "pending",
  rejected: "cancelled",
  cancelled: "cancelled",
  refunded: "refunded",
  charged_back: "refunded",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const mpToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");

  if (!mpToken) {
    console.error("MERCADO_PAGO_ACCESS_TOKEN not set");
    return new Response("OK", { status: 200, headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body));

    // Mercado Pago sends IPN notifications
    if (body.type === "payment" || body.action === "payment.updated" || body.action === "payment.created") {
      const paymentId = body.data?.id || body.id;

      if (!paymentId) {
        console.warn("No payment ID in webhook body");
        return new Response("OK", { status: 200, headers: corsHeaders });
      }

      // Fetch payment details from MP
      const mpRes = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${mpToken}` },
      });

      const mpPayment = await mpRes.json();

      if (!mpRes.ok) {
        console.error("Failed to fetch payment from MP:", mpPayment);
        return new Response("OK", { status: 200, headers: corsHeaders });
      }

      const mpStatus = mpPayment.status;
      const mappedStatus = STATUS_MAP[mpStatus] || "pending";
      const invoiceStatus = INVOICE_STATUS_MAP[mpStatus] || "pending";

      console.log(`Payment ${paymentId}: status=${mpStatus}, mapped=${mappedStatus}`);

      // Update payment record in DB
      const { data: existingPayment } = await supabase
        .from("payments")
        .select("id, invoice_id")
        .eq("mp_payment_id", String(paymentId))
        .maybeSingle();

      if (existingPayment) {
        await supabase
          .from("payments")
          .update({
            status: mappedStatus,
            mp_status: mpStatus,
            mp_status_detail: mpPayment.status_detail,
            metadata: {
              payment_method_id: mpPayment.payment_method_id,
              payment_type_id: mpPayment.payment_type_id,
              date_approved: mpPayment.date_approved,
              transaction_amount: mpPayment.transaction_amount,
              net_received_amount: mpPayment.transaction_details?.net_received_amount,
            },
          })
          .eq("id", existingPayment.id);

        // Update invoice status
        if (existingPayment.invoice_id) {
          const updateData: Record<string, any> = { status: invoiceStatus };
          if (mpStatus === "approved") {
            updateData.paid_at = mpPayment.date_approved || new Date().toISOString();
          }
          await supabase
            .from("invoices")
            .update(updateData)
            .eq("id", existingPayment.invoice_id);
        }
      } else {
        // Try to find by external reference
        const extRef = mpPayment.external_reference;
        if (extRef?.startsWith("inv_")) {
          const invoiceId = extRef.replace("inv_", "");

          await supabase.from("payments").insert({
            invoice_id: invoiceId,
            type: "incoming",
            status: mappedStatus,
            amount: mpPayment.transaction_amount,
            payment_method: mpPayment.payment_method_id,
            mp_payment_id: String(paymentId),
            mp_status: mpStatus,
            mp_status_detail: mpPayment.status_detail,
            payer_email: mpPayment.payer?.email,
            payer_name: `${mpPayment.payer?.first_name || ""} ${mpPayment.payer?.last_name || ""}`.trim(),
          });

          const updateData: Record<string, any> = {
            status: invoiceStatus,
            mp_payment_id: String(paymentId),
          };
          if (mpStatus === "approved") {
            updateData.paid_at = mpPayment.date_approved || new Date().toISOString();
          }
          await supabase.from("invoices").update(updateData).eq("id", invoiceId);
        }
      }

      // Update subscription status if applicable
      if (mpStatus === "approved" && mpPayment.external_reference?.startsWith("inv_")) {
        const invoiceId = mpPayment.external_reference.replace("inv_", "");
        const { data: invoice } = await supabase
          .from("invoices")
          .select("subscription_id")
          .eq("id", invoiceId)
          .maybeSingle();

        if (invoice?.subscription_id) {
          await supabase
            .from("subscriptions")
            .update({ status: "active" })
            .eq("id", invoice.subscription_id);
        }
      }
    }

    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Webhook error:", error);
    // Always return 200 to MP so it doesn't retry indefinitely
    return new Response("OK", { status: 200, headers: corsHeaders });
  }
});
