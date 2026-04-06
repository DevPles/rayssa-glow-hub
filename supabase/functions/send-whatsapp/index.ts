import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, message, type, metadata } = await req.json();

    if (!phone || !message) {
      return new Response(
        JSON.stringify({ error: "phone e message são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save notification to database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: notification, error: dbError } = await supabase
      .from("whatsapp_notifications")
      .insert({ phone, message, type: type || "agendamento", metadata: metadata || {} })
      .select()
      .single();

    if (dbError) {
      console.error("DB error:", dbError);
      return new Response(
        JSON.stringify({ error: "Erro ao salvar notificação", details: dbError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send to webhook (n8n/Zapier/Make)
    const webhookUrl = Deno.env.get("WHATSAPP_WEBHOOK_URL");

    if (webhookUrl) {
      try {
        const webhookResponse = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone,
            message,
            type: type || "agendamento",
            metadata: metadata || {},
            notification_id: notification.id,
            created_at: notification.created_at,
          }),
        });

        // Update status
        const newStatus = webhookResponse.ok ? "enviado" : "erro";
        await supabase
          .from("whatsapp_notifications")
          .update({ status: newStatus, sent_at: newStatus === "enviado" ? new Date().toISOString() : null })
          .eq("id", notification.id);

        if (!webhookResponse.ok) {
          console.error("Webhook error:", await webhookResponse.text());
        }
      } catch (webhookError) {
        console.error("Webhook fetch error:", webhookError);
        await supabase
          .from("whatsapp_notifications")
          .update({ status: "erro" })
          .eq("id", notification.id);
      }
    } else {
      console.warn("WHATSAPP_WEBHOOK_URL não configurada. Notificação salva mas não enviada.");
    }

    return new Response(
      JSON.stringify({ success: true, id: notification.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno", details: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
