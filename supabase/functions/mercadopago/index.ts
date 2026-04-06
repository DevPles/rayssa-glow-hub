import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MP_API = "https://api.mercadopago.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const mpToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN") || null;

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { action, ...params } = await req.json();

    // Resolve MP token: use tenant-specific if tenant_id provided, else global
    let resolvedMpToken = mpToken;
    if (params.tenant_id) {
      const { data: provider } = await supabase
        .from("payment_providers")
        .select("access_token, sandbox_token, is_sandbox, is_active")
        .eq("tenant_id", params.tenant_id)
        .eq("provider", "mercadopago")
        .maybeSingle();

      if (provider?.is_active) {
        resolvedMpToken = provider.is_sandbox ? provider.sandbox_token : provider.access_token;
      }
    }

    // For test_connection, use override token
    if (action === "test_connection") {
      const testToken = params.access_token_override;
      if (!testToken) {
        return new Response(JSON.stringify({ error: "Token não fornecido" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const testRes = await fetch(`${MP_API}/v1/payment_methods`, { headers: { Authorization: `Bearer ${testToken}` } });
      const testData = await testRes.json();
      if (!testRes.ok) {
        return new Response(JSON.stringify({ error: "Token inválido", details: testData }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ success: true, methods: testData.length }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Use resolved token for all actions
    const activeToken = resolvedMpToken;
    if (!activeToken) {
      return new Response(
        JSON.stringify({ error: "Token Mercado Pago não configurado para este tenant" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    switch (action) {
      // ===== CREATE PREFERENCE (Checkout Pro for one-time payments) =====
      case "create_preference": {
        const { tenant_id, invoice_id, items, payer, back_urls } = params;

        const external_reference = `inv_${invoice_id}`;

        const preference = {
          items: items.map((item: any) => ({
            title: item.title,
            quantity: item.quantity || 1,
            unit_price: item.unit_price,
            currency_id: "BRL",
          })),
          payer: payer || {},
          external_reference,
          back_urls: back_urls || {
            success: `${req.headers.get("origin") || ""}/pagamento/sucesso`,
            failure: `${req.headers.get("origin") || ""}/pagamento/erro`,
            pending: `${req.headers.get("origin") || ""}/pagamento/pendente`,
          },
          auto_return: "approved",
          notification_url: params.tenant_id ? `${supabaseUrl}/functions/v1/mercadopago-tenant-webhook?tenant_id=${params.tenant_id}` : `${supabaseUrl}/functions/v1/mercadopago-webhook`,
          payment_methods: {
            excluded_payment_types: [],
            installments: 12,
          },
        };

        const mpRes = await fetch(`${MP_API}/checkout/preferences`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${activeToken}`,
          },
          body: JSON.stringify(preference),
        });

        const mpData = await mpRes.json();

        if (!mpRes.ok) {
          console.error("MP create_preference error:", mpData);
          return new Response(
            JSON.stringify({ error: "Erro ao criar preferência", details: mpData }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Update invoice with MP preference ID
        if (invoice_id) {
          await supabase
            .from("invoices")
            .update({ mp_preference_id: mpData.id, mp_external_reference: external_reference })
            .eq("id", invoice_id);
        }

        return new Response(
          JSON.stringify({
            id: mpData.id,
            init_point: mpData.init_point,
            sandbox_init_point: mpData.sandbox_init_point,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ===== CREATE PIX PAYMENT =====
      case "create_pix_payment": {
        const { tenant_id, invoice_id, amount, description, payer } = params;

        const external_reference = `inv_${invoice_id}`;

        const payment = {
          transaction_amount: amount,
          description: description || "Pagamento via PIX",
          payment_method_id: "pix",
          payer: {
            email: payer?.email || "",
            first_name: payer?.first_name || "",
            last_name: payer?.last_name || "",
            identification: payer?.identification || {},
          },
          external_reference,
          notification_url: params.tenant_id ? `${supabaseUrl}/functions/v1/mercadopago-tenant-webhook?tenant_id=${params.tenant_id}` : `${supabaseUrl}/functions/v1/mercadopago-webhook`,
        };

        const mpRes = await fetch(`${MP_API}/v1/payments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${activeToken}`,
            "X-Idempotency-Key": crypto.randomUUID(),
          },
          body: JSON.stringify(payment),
        });

        const mpData = await mpRes.json();

        if (!mpRes.ok) {
          console.error("MP create_pix error:", mpData);
          return new Response(
            JSON.stringify({ error: "Erro ao criar pagamento PIX", details: mpData }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Save payment record
        await supabase.from("payments").insert({
          invoice_id,
          tenant_id,
          type: "incoming",
          status: "pending",
          amount,
          payment_method: "pix",
          mp_payment_id: String(mpData.id),
          mp_status: mpData.status,
          payer_email: payer?.email,
          payer_name: `${payer?.first_name || ""} ${payer?.last_name || ""}`.trim(),
          metadata: {
            qr_code: mpData.point_of_interaction?.transaction_data?.qr_code,
            qr_code_base64: mpData.point_of_interaction?.transaction_data?.qr_code_base64,
            ticket_url: mpData.point_of_interaction?.transaction_data?.ticket_url,
          },
        });

        // Update invoice
        if (invoice_id) {
          await supabase
            .from("invoices")
            .update({ mp_payment_id: String(mpData.id), mp_external_reference: external_reference, payment_method: "pix" })
            .eq("id", invoice_id);
        }

        return new Response(
          JSON.stringify({
            id: mpData.id,
            status: mpData.status,
            qr_code: mpData.point_of_interaction?.transaction_data?.qr_code,
            qr_code_base64: mpData.point_of_interaction?.transaction_data?.qr_code_base64,
            ticket_url: mpData.point_of_interaction?.transaction_data?.ticket_url,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ===== CREATE BOLETO PAYMENT =====
      case "create_boleto_payment": {
        const { tenant_id, invoice_id, amount, description, payer } = params;

        // Boleto requires payer identification
        if (!payer?.identification?.number) {
          return new Response(
            JSON.stringify({ error: "CPF/CNPJ do titular é obrigatório para gerar boleto. Preencha os dados bancários do cliente." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const external_reference = `inv_${invoice_id}`;

        const payment = {
          transaction_amount: amount,
          description: description || "Pagamento via Boleto",
          payment_method_id: "bolbradesco",
          payer: {
            email: payer?.email || "",
            first_name: payer?.first_name || "",
            last_name: payer?.last_name || "",
            identification: {
              type: payer.identification.type || "CPF",
              number: payer.identification.number,
            },
          },
          external_reference,
          notification_url: params.tenant_id ? `${supabaseUrl}/functions/v1/mercadopago-tenant-webhook?tenant_id=${params.tenant_id}` : `${supabaseUrl}/functions/v1/mercadopago-webhook`,
        };

        const mpRes = await fetch(`${MP_API}/v1/payments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${activeToken}`,
            "X-Idempotency-Key": crypto.randomUUID(),
          },
          body: JSON.stringify(payment),
        });

        const mpData = await mpRes.json();

        if (!mpRes.ok) {
          console.error("MP create_boleto error:", mpData);
          return new Response(
            JSON.stringify({ error: "Erro ao criar boleto", details: mpData }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        await supabase.from("payments").insert({
          invoice_id,
          tenant_id,
          type: "incoming",
          status: "pending",
          amount,
          payment_method: "boleto",
          mp_payment_id: String(mpData.id),
          mp_status: mpData.status,
          payer_email: payer?.email,
          payer_name: `${payer?.first_name || ""} ${payer?.last_name || ""}`.trim(),
          metadata: {
            barcode: mpData.barcode?.content,
            external_resource_url: mpData.transaction_details?.external_resource_url,
          },
        });

        if (invoice_id) {
          await supabase
            .from("invoices")
            .update({ mp_payment_id: String(mpData.id), mp_external_reference: external_reference, payment_method: "boleto" })
            .eq("id", invoice_id);
        }

        return new Response(
          JSON.stringify({
            id: mpData.id,
            status: mpData.status,
            barcode: mpData.barcode?.content,
            external_resource_url: mpData.transaction_details?.external_resource_url,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ===== CREATE CARD PAYMENT (Credit Card / Debit Auto via Checkout Pro) =====
      case "create_card_payment": {
        const { tenant_id, invoice_id, amount, description, payer } = params;

        const external_reference = `inv_${invoice_id}`;

        // For card payments, use Checkout Pro (preference) so MP handles card form
        const preference = {
          items: [{
            title: description || "Pagamento com Cartão",
            quantity: 1,
            unit_price: amount,
            currency_id: "BRL",
          }],
          payer: {
            email: payer?.email || "",
            first_name: payer?.first_name || "",
            last_name: payer?.last_name || "",
            identification: payer?.identification || {},
          },
          external_reference,
          back_urls: {
            success: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
            failure: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
            pending: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
          },
          auto_return: "approved",
          notification_url: params.tenant_id ? `${supabaseUrl}/functions/v1/mercadopago-tenant-webhook?tenant_id=${params.tenant_id}` : `${supabaseUrl}/functions/v1/mercadopago-webhook`,
          payment_methods: {
            excluded_payment_types: [{ id: "ticket" }, { id: "bank_transfer" }],
            installments: 12,
          },
        };

        const mpRes = await fetch(`${MP_API}/checkout/preferences`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${activeToken}`,
          },
          body: JSON.stringify(preference),
        });

        const mpData = await mpRes.json();

        if (!mpRes.ok) {
          console.error("MP create_card error:", mpData);
          return new Response(
            JSON.stringify({ error: "Erro ao criar pagamento com cartão", details: mpData }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Save payment record
        await supabase.from("payments").insert({
          invoice_id,
          tenant_id,
          type: "incoming",
          status: "pending",
          amount,
          payment_method: "credit_card",
          payer_email: payer?.email,
          payer_name: `${payer?.first_name || ""} ${payer?.last_name || ""}`.trim(),
          metadata: {
            init_point: mpData.init_point,
            sandbox_init_point: mpData.sandbox_init_point,
          },
        });

        // Update invoice
        if (invoice_id) {
          await supabase
            .from("invoices")
            .update({ mp_preference_id: mpData.id, mp_external_reference: external_reference, payment_method: "credit_card" })
            .eq("id", invoice_id);
        }

        return new Response(
          JSON.stringify({
            id: mpData.id,
            init_point: mpData.init_point,
            sandbox_init_point: mpData.sandbox_init_point,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ===== CHECK PAYMENT STATUS =====
      case "check_payment": {
        const { payment_id } = params;

        const mpRes = await fetch(`${MP_API}/v1/payments/${payment_id}`, {
          headers: { Authorization: `Bearer ${activeToken}` },
        });

        const mpData = await mpRes.json();

        if (!mpRes.ok) {
          return new Response(
            JSON.stringify({ error: "Erro ao consultar pagamento", details: mpData }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({
            id: mpData.id,
            status: mpData.status,
            status_detail: mpData.status_detail,
            payment_method_id: mpData.payment_method_id,
            transaction_amount: mpData.transaction_amount,
            date_approved: mpData.date_approved,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ===== CREATE SUBSCRIPTION INVOICE (for tenant billing) =====
      case "create_subscription_invoice": {
        const { tenant_id, plan_id, amount, description, payment_method } = params;

        // Create invoice in DB
        const { data: invoice, error: invError } = await supabase
          .from("invoices")
          .insert({
            tenant_id,
            type: "subscription",
            status: "pending",
            amount,
            payment_method: payment_method || "pix",
            description: description || "Assinatura mensal",
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          })
          .select()
          .single();

        if (invError) {
          return new Response(
            JSON.stringify({ error: "Erro ao criar fatura", details: invError.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ invoice }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ===== LIST INVOICES =====
      case "list_invoices": {
        const { tenant_id, status: invStatus, limit: invLimit } = params;

        let query = supabase
          .from("invoices")
          .select("*")
          .order("created_at", { ascending: false });

        if (tenant_id) query = query.eq("tenant_id", tenant_id);
        if (invStatus) query = query.eq("status", invStatus);
        if (invLimit) query = query.limit(invLimit);

        const { data, error } = await query;

        if (error) {
          return new Response(
            JSON.stringify({ error: "Erro ao listar faturas", details: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ invoices: data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ===== LIST PAYMENTS =====
      case "list_payments": {
        const { tenant_id: payTenantId, status: payStatus, limit: payLimit } = params;

        let query = supabase
          .from("payments")
          .select("*")
          .order("created_at", { ascending: false });

        if (payTenantId) query = query.eq("tenant_id", payTenantId);
        if (payStatus) query = query.eq("status", payStatus);
        if (payLimit) query = query.limit(payLimit);

        const { data, error } = await query;

        if (error) {
          return new Response(
            JSON.stringify({ error: "Erro ao listar pagamentos", details: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ payments: data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: `Ação desconhecida: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("MercadoPago error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno", details: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
