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
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get tenant_id from query string
    const url = new URL(req.url);
    const tenantId = url.searchParams.get("tenant_id");

    if (!tenantId) {
      console.error("No tenant_id in webhook URL");
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    // Fetch tenant's MP credentials
    const { data: provider } = await supabase
      .from("payment_providers")
      .select("access_token, sandbox_token, is_sandbox, is_active")
      .eq("tenant_id", tenantId)
      .eq("provider", "mercadopago")
      .maybeSingle();

    if (!provider || !provider.is_active) {
      console.error(`No active MP provider for tenant ${tenantId}`);
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const mpToken = provider.is_sandbox ? provider.sandbox_token : provider.access_token;
    if (!mpToken) {
      console.error(`No MP token for tenant ${tenantId}`);
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const body = await req.json();
    console.log(`Tenant ${tenantId} webhook:`, JSON.stringify(body));

    if (body.type === "payment" || body.action === "payment.updated" || body.action === "payment.created") {
      const paymentId = body.data?.id || body.id;
      if (!paymentId) return new Response("OK", { status: 200, headers: corsHeaders });

      const mpRes = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${mpToken}` },
      });
      const mpPayment = await mpRes.json();
      if (!mpRes.ok) {
        console.error("Failed to fetch payment:", mpPayment);
        return new Response("OK", { status: 200, headers: corsHeaders });
      }

      const mpStatus = mpPayment.status;
      const mappedStatus = STATUS_MAP[mpStatus] || "pending";
      const invoiceStatus = INVOICE_STATUS_MAP[mpStatus] || "pending";

      // Update existing payment
      const { data: existingPayment } = await supabase
        .from("payments")
        .select("id, invoice_id")
        .eq("mp_payment_id", String(paymentId))
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (existingPayment) {
        await supabase.from("payments").update({
          status: mappedStatus,
          mp_status: mpStatus,
          mp_status_detail: mpPayment.status_detail,
          metadata: {
            payment_method_id: mpPayment.payment_method_id,
            date_approved: mpPayment.date_approved,
            transaction_amount: mpPayment.transaction_amount,
            net_received_amount: mpPayment.transaction_details?.net_received_amount,
          },
        }).eq("id", existingPayment.id);

        if (existingPayment.invoice_id) {
          const updateData: Record<string, any> = { status: invoiceStatus };
          if (mpStatus === "approved") updateData.paid_at = mpPayment.date_approved || new Date().toISOString();
          await supabase.from("invoices").update(updateData).eq("id", existingPayment.invoice_id);
        }
      } else {
        const extRef = mpPayment.external_reference;
        if (extRef?.startsWith("inv_")) {
          const invoiceId = extRef.replace("inv_", "");
          await supabase.from("payments").insert({
            invoice_id: invoiceId,
            tenant_id: tenantId,
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
          const updateData: Record<string, any> = { status: invoiceStatus, mp_payment_id: String(paymentId) };
          if (mpStatus === "approved") updateData.paid_at = mpPayment.date_approved || new Date().toISOString();
          await supabase.from("invoices").update(updateData).eq("id", invoiceId);
        }
      }
    }

    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Tenant webhook error:", error);
    return new Response("OK", { status: 200, headers: corsHeaders });
  }
});
