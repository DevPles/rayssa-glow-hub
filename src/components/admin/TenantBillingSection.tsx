import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Plan } from "@/contexts/SystemSettingsContext";

interface Props {
  tenantId: string;
  tenantEmail: string;
  tenantName: string;
  holderName: string;
  holderDocument: string;
  plan: Plan | undefined;
}

const statusMap: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pendente", cls: "bg-yellow-100 text-yellow-700" },
  paid: { label: "Pago", cls: "bg-green-100 text-green-700" },
  overdue: { label: "Vencida", cls: "bg-destructive/15 text-destructive" },
  cancelled: { label: "Cancelada", cls: "bg-muted text-muted-foreground" },
  approved: { label: "Aprovado", cls: "bg-green-100 text-green-700" },
  active: { label: "Ativa", cls: "bg-green-100 text-green-700" },
  inactive: { label: "Inativa", cls: "bg-muted text-muted-foreground" },
  trialing: { label: "Trial", cls: "bg-blue-100 text-blue-700" },
};

export function TenantBillingSection({ tenantId, tenantEmail, tenantName, holderName, holderDocument, plan }: Props) {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [savingSub, setSavingSub] = useState(false);
  const [billingMethod, setBillingMethod] = useState<"pix" | "boleto" | "credit_card" | "debit_auto">("pix");
  const [billingDay, setBillingDay] = useState("10");
  const [subPaymentMethod, setSubPaymentMethod] = useState<"pix" | "boleto" | "credit_card" | "debit_auto">("pix");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: invData }, { data: subData }] = await Promise.all([
      supabase
        .from("invoices")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("type", "subscription")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("subscriptions")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(1),
    ]);
    setInvoices(invData || []);
    const sub = subData?.[0] || null;
    setSubscription(sub);
    if (sub) {
      setBillingDay(String(sub.billing_day || 10));
      setSubPaymentMethod(sub.payment_method === "boleto" ? "boleto" : "pix");
    }
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSaveSubscription = async () => {
    if (!plan) return;
    setSavingSub(true);
    try {
      const day = Math.min(28, Math.max(1, parseInt(billingDay) || 10));
      const now = new Date();
      const nextDue = new Date(now.getFullYear(), now.getMonth() + (now.getDate() > day ? 1 : 0), day);

      if (subscription) {
        await supabase
          .from("subscriptions")
          .update({
            plan_id: plan.id,
            amount: plan.priceMonthly,
            billing_day: day,
            payment_method: subPaymentMethod,
            status: "active",
          })
          .eq("id", subscription.id);
      } else {
        await supabase
          .from("subscriptions")
          .insert({
            tenant_id: tenantId,
            plan_id: plan.id,
            amount: plan.priceMonthly,
            billing_day: day,
            payment_method: subPaymentMethod,
            status: "active",
            started_at: new Date().toISOString(),
          });
      }
      toast({ title: "Assinatura salva!" });
      fetchData();
    } catch (e: any) {
      toast({ title: "Erro ao salvar assinatura", description: e.message, variant: "destructive" });
    }
    setSavingSub(false);
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;
    await supabase
      .from("subscriptions")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", subscription.id);
    toast({ title: "Assinatura cancelada." });
    fetchData();
  };

  const handleGenerateInvoice = async () => {
    if (!plan) { toast({ title: "Selecione um plano antes.", variant: "destructive" }); return; }
    if ((billingMethod === "boleto" || billingMethod === "debit_auto") && !holderDocument?.replace(/\D/g, "")) {
      toast({ title: "CPF/CNPJ obrigatório", description: "Preencha o CPF/CNPJ do titular antes de gerar boleto ou débito automático.", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const day = parseInt(billingDay) || 10;
      const now = new Date();
      const dueDate = new Date(now.getFullYear(), now.getMonth() + (now.getDate() > day ? 1 : 0), day);

      const { data: invData, error: invErr } = await supabase.functions.invoke("mercadopago", {
        body: {
          action: "create_subscription_invoice",
          tenant_id: tenantId,
          plan_id: plan.id,
          amount: plan.priceMonthly,
          description: `Mensalidade ${plan.name} — ${tenantName} — Venc. ${dueDate.toLocaleDateString("pt-BR")}`,
          payment_method: billingMethod,
        },
      });
      if (invErr || !invData?.invoice) throw new Error(invErr?.message || "Erro ao criar fatura");

      // Update due_date on the created invoice
      await supabase.from("invoices").update({ due_date: dueDate.toISOString().slice(0, 10) }).eq("id", invData.invoice.id);

      const invoice = invData.invoice;
      const payActionMap: Record<string, string> = {
        pix: "create_pix_payment",
        boleto: "create_boleto_payment",
        credit_card: "create_card_payment",
        debit_auto: "create_card_payment",
      };
      const payAction = payActionMap[billingMethod] || "create_pix_payment";
      const { error: payErr } = await supabase.functions.invoke("mercadopago", {
        body: {
          action: payAction,
          tenant_id: tenantId,
          invoice_id: invoice.id,
          amount: plan.priceMonthly,
          description: `Mensalidade ${plan.name} — ${tenantName}`,
          payer: {
            email: tenantEmail,
            first_name: holderName?.split(" ")[0] || tenantName.split(" ")[0],
            last_name: holderName?.split(" ").slice(1).join(" ") || "",
            identification: holderDocument ? { type: holderDocument.replace(/\D/g, "").length > 11 ? "CNPJ" : "CPF", number: holderDocument.replace(/\D/g, "") } : undefined,
          },
        },
      });

      if (payErr) throw new Error(payErr.message || "Erro ao gerar cobrança");

      toast({ title: "Cobrança gerada!", description: `Vencimento: ${dueDate.toLocaleDateString("pt-BR")}` });
      fetchData();
    } catch (e: any) {
      console.error("Billing error:", e);
      toast({ title: "Erro ao gerar cobrança", description: e.message, variant: "destructive" });
    }
    setGenerating(false);
  };

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("pt-BR");

  const nextDueDate = () => {
    const day = parseInt(billingDay) || 10;
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth() + (now.getDate() > day ? 1 : 0), Math.min(day, 28));
    return next.toLocaleDateString("pt-BR");
  };

  const lastPaidInvoice = invoices.find(i => i.status === "paid");
  const pendingInvoices = invoices.filter(i => i.status === "pending" || i.status === "overdue");

  return (
    <>
      {/* Subscription / Recurrence config */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Assinatura & Recorrência</p>
        <p className="text-[11px] text-muted-foreground mb-3">Configure o ciclo de cobrança recorrente deste cliente.</p>

        {subscription && (
          <Card className="bg-muted/30 border-border/20 rounded-xl mb-3">
            <CardContent className="p-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Status da Assinatura</span>
                <Badge className={`text-[10px] border-0 ${(statusMap[subscription.status] || statusMap.pending).cls}`}>
                  {(statusMap[subscription.status] || statusMap.pending).label}
                </Badge>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Início</span>
                <span className="font-medium text-foreground">{subscription.started_at ? fmtDate(subscription.started_at) : "—"}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Próximo vencimento</span>
                <span className="font-medium text-foreground">{nextDueDate()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Último pagamento</span>
                <span className="font-medium text-foreground">{lastPaidInvoice ? fmtDate(lastPaidInvoice.paid_at || lastPaidInvoice.created_at) : "Nenhum"}</span>
              </div>
              {pendingInvoices.length > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Faturas pendentes</span>
                  <span className="font-semibold text-yellow-600">{pendingInvoices.length}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Dia do Vencimento</Label>
            <Input
              type="number"
              min={1}
              max={28}
              value={billingDay}
              onChange={(e) => setBillingDay(e.target.value)}
              className="rounded-xl"
              placeholder="10"
            />
            <p className="text-[10px] text-muted-foreground">Dia do mês (1–28)</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Método Recorrente</Label>
            <Select value={subPaymentMethod} onValueChange={(v) => setSubPaymentMethod(v as any)}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
                <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                <SelectItem value="debit_auto">Débito Automático</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-start gap-2 mb-3">
          <Button onClick={handleSaveSubscription} disabled={savingSub || !plan} className="rounded-xl">
            {savingSub ? "Salvando..." : subscription ? "Atualizar" : "Criar Assinatura"}
          </Button>
          {subscription && subscription.status === "active" && (
            <Button variant="destructive" size="sm" onClick={handleCancelSubscription} className="rounded-xl">
              Cancelar
            </Button>
          )}
        </div>
        {plan && (
          <p className="text-[11px] text-muted-foreground">
            Próx. vencimento: <strong>{nextDueDate()}</strong> · Valor: <strong>{fmt(plan.priceMonthly)}</strong> · Plano: {plan.name}
          </p>
        )}
      </div>

      {/* Generate new billing */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Gerar Cobrança Avulsa</p>
        <p className="text-[11px] text-muted-foreground mb-3">Gere uma fatura única com PIX ou Boleto via Mercado Pago.</p>

        <div className="flex items-end gap-3">
          <div className="space-y-1.5 flex-1">
            <Label className="text-xs">Método de Pagamento</Label>
            <Select value={billingMethod} onValueChange={(v) => setBillingMethod(v as any)}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">PIX (QR Code)</SelectItem>
                <SelectItem value="boleto">Boleto Bancário</SelectItem>
                <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                <SelectItem value="debit_auto">Débito Automático</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleGenerateInvoice} disabled={generating || !plan} className="rounded-xl whitespace-nowrap">
            {generating ? "Gerando..." : "Gerar Cobrança"}
          </Button>
        </div>
      </div>

      {/* Invoice history */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Histórico de Faturas</p>
          <Button variant="ghost" size="sm" className="text-[10px] h-6" onClick={fetchData} disabled={loading}>
            {loading ? "..." : "Atualizar"}
          </Button>
        </div>

        {invoices.length === 0 ? (
          <Card className="bg-muted/30 border-border/20 rounded-xl">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Nenhuma fatura gerada ainda.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {invoices.map((inv) => {
              const st = statusMap[inv.status] || statusMap.pending;
              return (
                <Card key={inv.id} className="bg-muted/20 border-border/20 rounded-xl">
                  <CardContent className="p-3 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{inv.description || "Mensalidade"}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {fmtDate(inv.created_at)} · {inv.payment_method?.toUpperCase() || "—"} · Venc: {inv.due_date ? fmtDate(inv.due_date) : "—"}
                        {inv.paid_at && ` · Pago: ${fmtDate(inv.paid_at)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-semibold text-foreground">{fmt(inv.amount)}</span>
                      <Badge className={`text-[10px] border-0 ${st.cls}`}>{st.label}</Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
