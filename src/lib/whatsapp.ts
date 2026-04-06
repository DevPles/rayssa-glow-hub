import { supabase } from "@/integrations/supabase/client";

const ADMIN_PHONES = ["5511945383845", "5511960611112"];

interface WhatsAppNotification {
  phone?: string;
  message: string;
  type: "agendamento" | "compra";
  metadata?: Record<string, unknown>;
}

export async function sendWhatsAppNotification({
  phone,
  message,
  type,
  metadata = {},
}: WhatsAppNotification) {
  const phones = phone ? [phone] : ADMIN_PHONES;

  const results = await Promise.all(
    phones.map(async (p) => {
      try {
        const { data, error } = await supabase.functions.invoke("send-whatsapp", {
          body: { phone: p, message, type, metadata },
        });

        if (error) {
          console.error(`Erro ao enviar WhatsApp para ${p}:`, error);
          return { success: false, phone: p, error };
        }
        return { success: true, phone: p, data };
      } catch (err) {
        console.error(`Erro inesperado ao enviar WhatsApp para ${p}:`, err);
        return { success: false, phone: p, error: err };
      }
    })
  );

  return { success: results.some((r) => r.success), results };
}

// Helper para agendamentos
export function buildBookingMessage(data: {
  clientName: string;
  serviceTitle: string;
  date: string;
  time: string;
  phone: string;
}) {
  return `📅 *Novo Agendamento*\n\n👤 Cliente: ${data.clientName}\n📋 Serviço: ${data.serviceTitle}\n📆 Data: ${data.date}\n🕐 Horário: ${data.time}\n📱 Telefone: ${data.phone}`;
}

// Helper para compras
export function buildPurchaseMessage(data: {
  clientName: string;
  items: string[];
  total: string;
}) {
  const itemsList = data.items.map((i) => `  • ${i}`).join("\n");
  return `🛒 *Nova Compra*\n\n👤 Cliente: ${data.clientName}\n📦 Itens:\n${itemsList}\n💰 Total: ${data.total}`;
}
