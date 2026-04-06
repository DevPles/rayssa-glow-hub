import { useState, useMemo, useEffect, useCallback } from "react";
import { Plus, Trash2, Save, TrendingUp, TrendingDown, Target, Zap, CalendarIcon, ChevronLeft, ChevronRight, Pencil, Download, CreditCard, QrCode, FileText, RefreshCw, ExternalLink, Copy, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfMonth, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import { useFaturamento, expenseCategoryLabels, typeLabels, type ExpenseCategory, type RevenueEntry, type Expense } from "@/contexts/FaturamentoContext";
import { useSystemSettings } from "@/contexts/SystemSettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoImg from "@/assets/logo.png";
import { PaymentConfigTab } from "./PaymentConfigTab";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;

const TAX_RATE = 0.12;
const DEFAULT_GOAL = 25000;

const emptyExpense: Omit<Expense, "id"> = { description: "", category: "outros", amount: 0, date: new Date().toISOString().slice(0, 10) };
const emptyRevenue: Omit<RevenueEntry, "id"> = { description: "", type: "servico", amount: 0, date: new Date().toISOString().slice(0, 10) };

type View = "painel" | "receitas" | "despesas" | "dre" | "simulador" | "cobrancas" | "config_recebimento";

interface SimItem {
  id: string;
  name: string;
  sellPrice: number;
  cost: number;
  monthlyQty: number;
  fixedCostShare: number;
  laborMinutes: number;
  commissionPct: number;
}

const defaultSimItems: SimItem[] = [
  { id: "s1", name: "Limpeza de Pele Profunda", sellPrice: 180, cost: 35, monthlyQty: 8, fixedCostShare: 5, laborMinutes: 60, commissionPct: 10 },
  { id: "s2", name: "Microagulhamento", sellPrice: 350, cost: 60, monthlyQty: 5, fixedCostShare: 8, laborMinutes: 45, commissionPct: 10 },
  { id: "s3", name: "Harmonização Facial", sellPrice: 500, cost: 120, monthlyQty: 3, fixedCostShare: 10, laborMinutes: 90, commissionPct: 15 },
  { id: "s4", name: "Sérum Vitamina C", sellPrice: 189, cost: 89, monthlyQty: 12, fixedCostShare: 2, laborMinutes: 0, commissionPct: 5 },
  { id: "s5", name: "Radiofrequência", sellPrice: 280, cost: 40, monthlyQty: 6, fixedCostShare: 7, laborMinutes: 40, commissionPct: 10 },
];

const LABOR_COST_PER_HOUR = 30; // R$/hora mão de obra

export const FinanceiroTab = () => {
  const { revenue, expenses, monthlyGoals, addRevenue, addExpense, updateRevenue, updateExpense, deleteRevenue, deleteExpense, setMonthlyGoal } = useFaturamento();
  const { settings: sysSettings } = useSystemSettings();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [view, setView] = useState<View>("painel");
  const [expDialog, setExpDialog] = useState(false);
  const [revDialog, setRevDialog] = useState(false);
  const [expForm, setExpForm] = useState<Omit<Expense, "id">>(emptyExpense);
  const [revForm, setRevForm] = useState<Omit<RevenueEntry, "id">>(emptyRevenue);
  const [revEditId, setRevEditId] = useState<string | null>(null);
  const [expEditId, setExpEditId] = useState<string | null>(null);
  const [periodDate, setPeriodDate] = useState(startOfMonth(new Date()));
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [simItems, setSimItems] = useState<SimItem[]>(defaultSimItems);
  const [simDialog, setSimDialog] = useState(false);
  const [simEditId, setSimEditId] = useState<string | null>(null);
  const [simForm, setSimForm] = useState<Omit<SimItem, "id">>({ name: "", sellPrice: 0, cost: 0, monthlyQty: 1, fixedCostShare: 5, laborMinutes: 30, commissionPct: 10 });

  // Cobranças MP state
  const [mpInvoices, setMpInvoices] = useState<any[]>([]);
  const [mpPayments, setMpPayments] = useState<any[]>([]);
  const [mpLoading, setMpLoading] = useState(false);
  const [mpNewDialog, setMpNewDialog] = useState(false);
  const [mpNewForm, setMpNewForm] = useState({ description: "", amount: 0, payment_method: "pix", payer_email: "", payer_name: "" });
  const [mpCreating, setMpCreating] = useState(false);
  const [mpPixResult, setMpPixResult] = useState<any>(null);

  const tenantId = user?.tenantId;

  const fetchMpData = useCallback(async () => {
    setMpLoading(true);
    try {
      let invQuery = supabase.from("invoices").select("*").order("created_at", { ascending: false }).limit(50);
      let payQuery = supabase.from("payments").select("*").order("created_at", { ascending: false }).limit(50);

      // Admin sees only their tenant's data; super_admin sees all
      if (tenantId) {
        invQuery = invQuery.eq("tenant_id", tenantId);
        payQuery = payQuery.eq("tenant_id", tenantId);
      }

      const [invRes, payRes] = await Promise.all([invQuery, payQuery]);
      if (invRes.data) setMpInvoices(invRes.data);
      if (payRes.data) setMpPayments(payRes.data);
    } catch (err) {
      console.error("Error fetching MP data:", err);
    }
    setMpLoading(false);
  }, [tenantId]);

  useEffect(() => {
    if (view === "cobrancas" || view === "dre" || view === "painel") fetchMpData();
  }, [view, fetchMpData]);

  const handleCreateMpInvoice = async () => {
    if (!mpNewForm.description || !mpNewForm.amount || !mpNewForm.payer_email) {
      toast({ title: "Preencha descrição, valor e e-mail", variant: "destructive" });
      return;
    }
    setMpCreating(true);
    try {
      // 1. Create invoice in DB
      const { data: invoice, error: invErr } = await supabase
        .from("invoices")
        .insert({
          type: "service" as string,
          status: "pending",
          amount: mpNewForm.amount,
          payment_method: mpNewForm.payment_method,
          description: mpNewForm.description,
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          tenant_id: tenantId || null,
        } as any)
        .select()
        .single();

      if (invErr || !invoice) {
        toast({ title: "Erro ao criar fatura", description: invErr?.message, variant: "destructive" });
        setMpCreating(false);
        return;
      }

      // 2. Create payment via Mercado Pago
      const action = mpNewForm.payment_method === "pix" ? "create_pix_payment" : mpNewForm.payment_method === "boleto" ? "create_boleto_payment" : "create_preference";

      const { data: mpResult, error: mpErr } = await supabase.functions.invoke("mercadopago", {
        body: {
          action,
          tenant_id: tenantId || undefined,
          invoice_id: invoice.id,
          amount: mpNewForm.amount,
          description: mpNewForm.description,
          items: [{ title: mpNewForm.description, unit_price: mpNewForm.amount, quantity: 1 }],
          payer: {
            email: mpNewForm.payer_email,
            first_name: mpNewForm.payer_name.split(" ")[0] || "",
            last_name: mpNewForm.payer_name.split(" ").slice(1).join(" ") || "",
          },
        },
      });

      if (mpErr) {
        toast({ title: "Erro no Mercado Pago", description: mpErr.message, variant: "destructive" });
      } else if (mpResult?.qr_code) {
        setMpPixResult(mpResult);
        toast({ title: "PIX gerado com sucesso!" });
      } else if (mpResult?.init_point) {
        window.open(mpResult.init_point, "_blank");
        toast({ title: "Link de pagamento criado!" });
      } else if (mpResult?.barcode) {
        toast({ title: "Boleto gerado!", description: "Código de barras copiado." });
        navigator.clipboard.writeText(mpResult.barcode);
      } else {
        toast({ title: "Cobrança criada!" });
      }

      setMpNewDialog(false);
      setMpNewForm({ description: "", amount: 0, payment_method: "pix", payer_email: "", payer_name: "" });
      fetchMpData();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
    setMpCreating(false);
  };

  const mpStatusIcon = (status: string) => {
    switch (status) {
      case "paid": case "approved": return <CheckCircle className="h-3.5 w-3.5 text-primary" />;
      case "pending": case "in_process": return <Clock className="h-3.5 w-3.5 text-amber-500" />;
      case "cancelled": case "rejected": return <XCircle className="h-3.5 w-3.5 text-destructive" />;
      default: return <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  const mpStatusLabel = (status: string) => {
    const map: Record<string, string> = { pending: "Pendente", paid: "Pago", approved: "Aprovado", overdue: "Vencida", cancelled: "Cancelada", rejected: "Rejeitado", refunded: "Estornado", in_process: "Processando" };
    return map[status] || status;
  };

  const mpMethodLabel = (method: string) => {
    const map: Record<string, string> = { pix: "PIX", boleto: "Boleto", credit_card: "Cartão", debit: "Débito", bolbradesco: "Boleto" };
    return map[method] || method || "—";
  };

  const openSimNew = () => { setSimEditId(null); setSimForm({ name: "", sellPrice: 0, cost: 0, monthlyQty: 1, fixedCostShare: 5, laborMinutes: 30, commissionPct: 10 }); setSimDialog(true); };
  const openSimEdit = (item: SimItem) => { setSimEditId(item.id); setSimForm({ name: item.name, sellPrice: item.sellPrice, cost: item.cost, monthlyQty: item.monthlyQty, fixedCostShare: item.fixedCostShare, laborMinutes: item.laborMinutes, commissionPct: item.commissionPct }); setSimDialog(true); };
  const handleSimSave = () => {
    if (!simForm.name || !simForm.sellPrice) { toast({ title: "Preencha nome e preço", variant: "destructive" }); return; }
    if (simEditId) {
      setSimItems((prev) => prev.map((si) => si.id === simEditId ? { ...si, ...simForm } : si));
      toast({ title: "Item atualizado!" });
    } else {
      setSimItems((prev) => [...prev, { id: `sim_${Date.now()}`, ...simForm }]);
      toast({ title: "Item adicionado!" });
    }
    setSimDialog(false);
  };

  const period = `${periodDate.getFullYear()}-${String(periodDate.getMonth() + 1).padStart(2, "0")}`;
  const MONTHLY_GOAL = monthlyGoals[period] ?? DEFAULT_GOAL;

  // Current period data
  const filteredRev = useMemo(() => revenue.filter((r) => r.date.startsWith(period)), [revenue, period]);
  const filteredExp = useMemo(() => expenses.filter((e) => e.date.startsWith(period)), [expenses, period]);

  // Previous period for comparison
  const prevPeriod = useMemo(() => {
    const [y, m] = period.split("-").map(Number);
    const pm = m === 1 ? 12 : m - 1;
    const py = m === 1 ? y - 1 : y;
    return `${py}-${String(pm).padStart(2, "0")}`;
  }, [period]);
  const prevRev = useMemo(() => revenue.filter((r) => r.date.startsWith(prevPeriod)), [revenue, prevPeriod]);
  const prevExp = useMemo(() => expenses.filter((e) => e.date.startsWith(prevPeriod)), [expenses, prevPeriod]);

  // Billing system data filtered by period
  const billingPaidInvoices = useMemo(() => {
    return mpInvoices.filter(inv =>
      (inv.status === "paid" || inv.status === "approved") &&
      (inv.paid_at || inv.created_at).startsWith(period)
    );
  }, [mpInvoices, period]);

  const billingPendingInvoices = useMemo(() => {
    return mpInvoices.filter(inv =>
      (inv.status === "pending" || inv.status === "overdue") &&
      inv.created_at.startsWith(period)
    );
  }, [mpInvoices, period]);

  const billingRevenue = billingPaidInvoices.reduce((s, inv) => s + Number(inv.amount), 0);
  const billingPending = billingPendingInvoices.reduce((s, inv) => s + Number(inv.amount), 0);

  // Billing by payment method
  const billingByMethod = useMemo(() => {
    const acc: Record<string, number> = {};
    billingPaidInvoices.forEach(inv => {
      const method = inv.payment_method || "outro";
      acc[method] = (acc[method] || 0) + Number(inv.amount);
    });
    return Object.entries(acc).sort((a, b) => b[1] - a[1]);
  }, [billingPaidInvoices]);

  const methodLabels: Record<string, string> = { pix: "PIX", boleto: "Boleto", credit_card: "Cartão de Crédito", debit_auto: "Débito Automático", outro: "Outro" };

  // Core metrics (includes billing revenue)
  const totalRevenue = filteredRev.reduce((s, r) => s + r.amount, 0);
  const totalRevenueWithBilling = totalRevenue + billingRevenue;
  const totalExpenses = filteredExp.reduce((s, e) => s + e.amount, 0);
  const taxEstimate = totalRevenueWithBilling * TAX_RATE;
  const netProfit = totalRevenueWithBilling - totalExpenses - taxEstimate;
  const profitMargin = totalRevenueWithBilling > 0 ? (netProfit / totalRevenueWithBilling) * 100 : 0;

  const prevTotalRevenue = prevRev.reduce((s, r) => s + r.amount, 0);
  const prevTotalExpenses = prevExp.reduce((s, e) => s + e.amount, 0);
  const prevNetProfit = prevTotalRevenue - prevTotalExpenses - (prevTotalRevenue * TAX_RATE);

  const revenueGrowth = prevTotalRevenue > 0 ? ((totalRevenueWithBilling - prevTotalRevenue) / prevTotalRevenue) * 100 : 0;
  const profitGrowth = prevNetProfit > 0 ? ((netProfit - prevNetProfit) / prevNetProfit) * 100 : 0;

  // KPIs
  const totalTransactions = filteredRev.length + billingPaidInvoices.length;
  const ticketMedio = totalTransactions > 0 ? totalRevenueWithBilling / totalTransactions : 0;
  const goalProgress = Math.min(100, (totalRevenueWithBilling / MONTHLY_GOAL) * 100);
  const costRatio = totalRevenueWithBilling > 0 ? (totalExpenses / totalRevenueWithBilling) * 100 : 0;

  // Revenue breakdown
  const revenueByType = useMemo(() => {
    const acc: Record<string, number> = {};
    filteredRev.forEach((r) => { acc[r.type] = (acc[r.type] || 0) + r.amount; });
    return Object.entries(acc).sort((a, b) => b[1] - a[1]);
  }, [filteredRev]);

  const expenseByCategory = useMemo(() => {
    const acc: Record<string, number> = {};
    filteredExp.forEach((e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; });
    return Object.entries(acc).sort((a, b) => b[1] - a[1]);
  }, [filteredExp]);

  // Top revenue items (ranking)
  const topRevenue = useMemo(() => {
    const map: Record<string, { desc: string; total: number; count: number; type: string }> = {};
    filteredRev.forEach((r) => {
      const key = r.description.replace(/\s*—\s*.+$/, "").replace(/\s*\(x\d+\)/, "");
      if (!map[key]) map[key] = { desc: key, total: 0, count: 0, type: r.type };
      map[key].total += r.amount;
      map[key].count += 1;
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 8);
  }, [filteredRev]);

  // Daily cash flow
  const dailyFlow = useMemo(() => {
    const days: Record<string, { rev: number; exp: number }> = {};
    filteredRev.forEach((r) => {
      if (!days[r.date]) days[r.date] = { rev: 0, exp: 0 };
      days[r.date].rev += r.amount;
    });
    filteredExp.forEach((e) => {
      if (!days[e.date]) days[e.date] = { rev: 0, exp: 0 };
      days[e.date].exp += e.amount;
    });
    return Object.entries(days).sort((a, b) => a[0].localeCompare(b[0])).map(([date, v]) => ({
      date,
      label: new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      rev: v.rev,
      exp: v.exp,
      net: v.rev - v.exp,
    }));
  }, [filteredRev, filteredExp]);

  // Insights
  const insights = useMemo(() => {
    const list: { type: "success" | "warning" | "tip"; text: string }[] = [];
    if (profitMargin > 25) list.push({ type: "success", text: `Margem de ${profitMargin.toFixed(1)}% está excelente! Acima da média do setor (15-20%).` });
    else if (profitMargin > 15) list.push({ type: "tip", text: `Margem de ${profitMargin.toFixed(1)}% está na média. Considere aumentar ticket médio ou reduzir custos operacionais.` });
    else if (profitMargin > 0) list.push({ type: "warning", text: `Margem de ${profitMargin.toFixed(1)}% está baixa. Revise despesas e estratégia de preços.` });
    else list.push({ type: "warning", text: `Resultado negativo! Ação urgente necessária para equilibrar receitas e despesas.` });

    if (revenueGrowth > 10) list.push({ type: "success", text: `Receita cresceu ${revenueGrowth.toFixed(1)}% vs mês anterior. Continue investindo no que está funcionando.` });
    else if (revenueGrowth < -5) list.push({ type: "warning", text: `Receita caiu ${Math.abs(revenueGrowth).toFixed(1)}% vs mês anterior. Avalie campanhas de reativação.` });

    if (costRatio > 70) list.push({ type: "warning", text: `Custos representam ${costRatio.toFixed(0)}% da receita. Ideal é manter abaixo de 60%.` });

    if (ticketMedio < 200) list.push({ type: "tip", text: `Ticket médio de ${fmt(ticketMedio)}. Estratégia de upsell e combos pode elevar para R$ 300+.` });
    else list.push({ type: "success", text: `Ticket médio de ${fmt(ticketMedio)} é saudável para o segmento.` });

    const topType = revenueByType[0];
    if (topType) {
      const share = totalRevenue > 0 ? (topType[1] / totalRevenue * 100).toFixed(0) : 0;
      list.push({ type: "tip", text: `${typeLabels[topType[0]]} representa ${share}% da receita. ${Number(share) > 60 ? "Diversifique fontes para reduzir risco." : "Boa diversificação."}` });
    }

    if (goalProgress >= 100) list.push({ type: "success", text: `🎯 Meta mensal de ${fmt(MONTHLY_GOAL)} atingida! Parabéns!` });
    else if (goalProgress >= 70) list.push({ type: "tip", text: `${goalProgress.toFixed(0)}% da meta atingida. Faltam ${fmt(MONTHLY_GOAL - totalRevenue)} — intensifique agendamentos.` });
    else list.push({ type: "warning", text: `Apenas ${goalProgress.toFixed(0)}% da meta. Considere promoções ou pacotes especiais.` });

    const biggestExp = expenseByCategory[0];
    if (biggestExp) list.push({ type: "tip", text: `Maior gasto: ${expenseCategoryLabels[biggestExp[0] as ExpenseCategory]} (${fmt(biggestExp[1])}). Negocie condições melhores ou busque alternativas.` });

    return list;
  }, [profitMargin, revenueGrowth, costRatio, ticketMedio, revenueByType, totalRevenue, goalProgress, expenseByCategory]);

  const handleSaveExpense = () => {
    if (!expForm.description || !expForm.amount) { toast({ title: "Preencha todos os campos", variant: "destructive" }); return; }
    if (expEditId) {
      updateExpense(expEditId, expForm);
      toast({ title: "Despesa atualizada!" });
    } else {
      addExpense(expForm);
      toast({ title: "Despesa registrada!" });
    }
    setExpDialog(false); setExpForm(emptyExpense); setExpEditId(null);
  };

  const handleSaveRevenue = () => {
    if (!revForm.description || !revForm.amount) { toast({ title: "Preencha todos os campos", variant: "destructive" }); return; }
    if (revEditId) {
      updateRevenue(revEditId, revForm);
      toast({ title: "Receita atualizada!" });
    } else {
      addRevenue(revForm);
      toast({ title: "Receita registrada!" });
    }
    setRevDialog(false); setRevForm(emptyRevenue); setRevEditId(null);
  };

  const GrowthBadge = ({ value }: { value: number }) => (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-heading font-bold ${value >= 0 ? "text-primary" : "text-destructive"}`}>
      {value >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {pct(value)}
    </span>
  );

  const exportDREtoPDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const periodLabel = new Date(period + "-01").toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

    // Load logo
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = logoImg;
      });
      doc.addImage(img, "PNG", 14, 10, 40, 16);
    } catch { /* skip logo if fails */ }

    // Header
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text(sysSettings.companyName, pageWidth - 14, 16, { align: "right" });
    doc.text("CNPJ: 00.000.000/0001-00", pageWidth - 14, 22, { align: "right" });

    // Title
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text("Demonstrativo de Resultado (DRE)", 14, 40);
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(`Período: ${periodLabel.charAt(0).toUpperCase() + periodLabel.slice(1)}`, 14, 48);

    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 52, pageWidth - 14, 52);

    // Build DRE rows
    const ebitda = totalRevenueWithBilling - totalExpenses;
    const rows: (string | { content: string; styles?: Record<string, unknown> })[][] = [];

    // Revenue section
    rows.push([{ content: "RECEITA BRUTA TOTAL", styles: { fontStyle: "bold", fillColor: [245, 245, 245] } }, { content: fmt(totalRevenueWithBilling), styles: { fontStyle: "bold", halign: "right", fillColor: [245, 245, 245] } }]);
    if (totalRevenue > 0) {
      rows.push([{ content: "    Receita Operacional", styles: { fontStyle: "italic" } }, { content: fmt(totalRevenue), styles: { halign: "right" } }]);
    }
    revenueByType.forEach(([type, amount]) => {
      rows.push([`        ${typeLabels[type] || type}`, { content: fmt(amount), styles: { halign: "right" } }]);
    });
    if (billingRevenue > 0) {
      rows.push([{ content: "    Receita de Cobranças (Sistema)", styles: { fontStyle: "italic" } }, { content: fmt(billingRevenue), styles: { halign: "right" } }]);
      billingByMethod.forEach(([method, amount]) => {
        rows.push([`        ${methodLabels[method] || method}`, { content: fmt(amount), styles: { halign: "right" } }]);
      });
    }

    // Expenses section
    rows.push([{ content: "(-) DESPESAS OPERACIONAIS", styles: { fontStyle: "bold", fillColor: [245, 245, 245] } }, { content: fmt(totalExpenses), styles: { fontStyle: "bold", halign: "right", fillColor: [245, 245, 245] } }]);
    expenseByCategory.forEach(([cat, amount]) => {
      rows.push([`    ${expenseCategoryLabels[cat as ExpenseCategory] || cat}`, { content: fmt(amount), styles: { halign: "right" } }]);
    });

    // Results
    rows.push([{ content: "= LUCRO OPERACIONAL (EBITDA)", styles: { fontStyle: "bold" } }, { content: fmt(ebitda), styles: { fontStyle: "bold", halign: "right" } }]);
    rows.push([`    (-) Impostos Estimados (${(TAX_RATE * 100).toFixed(0)}%)`, { content: fmt(taxEstimate), styles: { halign: "right" } }]);
    rows.push([{ content: "= LUCRO LÍQUIDO", styles: { fontStyle: "bold", fillColor: netProfit >= 0 ? [230, 245, 230] : [255, 230, 230] } }, { content: fmt(netProfit), styles: { fontStyle: "bold", halign: "right", fillColor: netProfit >= 0 ? [230, 245, 230] : [255, 230, 230] } }]);
    rows.push([{ content: "Margem Líquida", styles: { fontStyle: "bold" } }, { content: `${profitMargin.toFixed(1)}%`, styles: { fontStyle: "bold", halign: "right" } }]);

    autoTable(doc, {
      startY: 56,
      head: [],
      body: rows,
      theme: "plain",
      styles: { fontSize: 10, cellPadding: 4, lineColor: [220, 220, 220], lineWidth: 0.1 },
      columnStyles: { 0: { cellWidth: "auto" }, 1: { cellWidth: 50 } },
      margin: { left: 14, right: 14 },
    });

    // Footer
    const finalY = (doc as any).lastAutoTable?.finalY + 15 || 200;
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text(`Gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`, 14, finalY);
    doc.text(sysSettings.companyName, pageWidth - 14, finalY, { align: "right" });

    doc.save(`DRE_${period}.pdf`);
    toast({ title: "PDF exportado com sucesso!" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {(["painel", "receitas", "despesas", "dre", "simulador", "cobrancas", ...(isAdmin ? ["config_recebimento" as const] : [])] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className={`text-sm px-4 py-2 rounded-full font-heading transition-all ${view === v ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary/20"}`}>
              {v === "painel" ? "Painel" : v === "receitas" ? "Receitas" : v === "despesas" ? "Despesas" : v === "dre" ? "DRE" : v === "simulador" ? "Simulador" : v === "cobrancas" ? "Cobranças MP" : "Config. Recebimento"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setPeriodDate((d) => subMonths(d, 1))}><ChevronLeft className="h-4 w-4" /></Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="rounded-full h-9 px-4 text-sm font-heading capitalize">
                <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                {format(periodDate, "MMMM yyyy", { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={periodDate}
                onSelect={(d) => d && setPeriodDate(startOfMonth(d))}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setPeriodDate((d) => addMonths(d, 1))}><ChevronRight className="h-4 w-4" /></Button>
          {view === "simulador" && (
            <Button onClick={openSimNew} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full text-sm font-heading ml-2">
              <Plus className="h-4 w-4 mr-1" /> Novo Item
            </Button>
          )}
          {view === "receitas" && (
            <Button onClick={() => { setRevEditId(null); setRevForm(emptyRevenue); setRevDialog(true); }} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full text-sm font-heading ml-2">
              <Plus className="h-4 w-4 mr-1" /> Nova Receita
            </Button>
          )}
          {view === "despesas" && (
            <Button onClick={() => { setExpEditId(null); setExpForm(emptyExpense); setExpDialog(true); }} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full text-sm font-heading ml-2">
              <Plus className="h-4 w-4 mr-1" /> Nova Despesa
            </Button>
          )}
          {view === "dre" && (
            <Button onClick={exportDREtoPDF} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full text-sm font-heading ml-2">
              <Download className="h-4 w-4 mr-1" /> Exportar PDF
            </Button>
          )}
          {view === "cobrancas" && (
            <div className="flex items-center gap-2 ml-2">
              <Button onClick={() => fetchMpData()} variant="outline" size="icon" className="h-9 w-9 rounded-full" disabled={mpLoading}>
                <RefreshCw className={`h-4 w-4 ${mpLoading ? "animate-spin" : ""}`} />
              </Button>
              <Button onClick={() => { setMpNewForm({ description: "", amount: 0, payment_method: "pix", payer_email: "", payer_name: "" }); setMpNewDialog(true); }} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full text-sm font-heading">
                <Plus className="h-4 w-4 mr-1" /> Nova Cobrança
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ===== PAINEL ===== */}
      {view === "painel" && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
             <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5"><CardContent className="p-4">
               <p className="text-lg font-heading font-bold text-foreground">{fmt(totalRevenueWithBilling)}</p>
               <div className="flex items-center justify-between"><p className="text-[10px] text-muted-foreground font-heading uppercase tracking-wider">Receita</p><GrowthBadge value={revenueGrowth} /></div>
             </CardContent></Card>
             <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5"><CardContent className="p-4">
               <p className="text-lg font-heading font-bold text-foreground">{fmt(totalExpenses)}</p>
               <p className="text-[10px] text-muted-foreground font-heading uppercase tracking-wider">Despesas</p>
             </CardContent></Card>
             <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5"><CardContent className="p-4">
               <p className={`text-lg font-heading font-bold ${netProfit >= 0 ? "text-foreground" : "text-destructive"}`}>{fmt(netProfit)}</p>
               <div className="flex items-center justify-between"><p className="text-[10px] text-muted-foreground font-heading uppercase tracking-wider">Lucro Líquido</p><GrowthBadge value={profitGrowth} /></div>
             </CardContent></Card>
             <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5"><CardContent className="p-4">
               <p className="text-lg font-heading font-bold text-foreground">{fmt(ticketMedio)}</p>
               <p className="text-[10px] text-muted-foreground font-heading uppercase tracking-wider">Ticket Médio</p>
             </CardContent></Card>
             <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5"><CardContent className="p-4">
               <p className="text-lg font-heading font-bold text-foreground">{profitMargin.toFixed(1)}%</p>
               <p className="text-[10px] text-muted-foreground font-heading uppercase tracking-wider">Margem Líquida</p>
             </CardContent></Card>
          </div>

          {/* Meta mensal */}
           <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="font-heading font-bold text-sm text-foreground">Meta Mensal</span>
                  {!editingGoal && (
                    <button onClick={() => { setGoalInput(String(MONTHLY_GOAL)); setEditingGoal(true); }} className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                      <Pencil className="h-3 w-3" />
                    </button>
                  )}
                </div>
                {editingGoal ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={goalInput}
                      onChange={(e) => setGoalInput(e.target.value)}
                      className="h-7 w-32 rounded-lg text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const val = Number(goalInput);
                          if (val > 0) { setMonthlyGoal(period, val); setEditingGoal(false); toast({ title: "Meta atualizada!" }); }
                        }
                        if (e.key === "Escape") setEditingGoal(false);
                      }}
                    />
                    <Button size="sm" className="h-7 rounded-full text-xs" onClick={() => {
                      const val = Number(goalInput);
                      if (val > 0) { setMonthlyGoal(period, val); setEditingGoal(false); toast({ title: "Meta atualizada!" }); }
                    }}>OK</Button>
                  </div>
                ) : (
                  <span className="font-heading text-sm text-muted-foreground">{fmt(totalRevenueWithBilling)} / {fmt(MONTHLY_GOAL)}</span>
                )}
              </div>
              <Progress value={goalProgress} className="h-2.5" />
              <p className="text-[10px] text-muted-foreground mt-1.5 font-heading">{goalProgress.toFixed(0)}% atingido — faltam {fmt(Math.max(0, MONTHLY_GOAL - totalRevenue))}</p>
            </CardContent>
          </Card>

          {/* Breakdown + Ranking */}
          <div className="grid md:grid-cols-2 gap-5">
            {/* Revenue by type with visual bars */}
             <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
              <CardContent className="p-5">
                <h3 className="font-heading font-bold text-sm text-foreground mb-4">Composição da Receita</h3>
                <div className="space-y-3">
                  {revenueByType.map(([type, amount]) => {
                    const share = totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0;
                    return (
                      <div key={type}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-heading text-foreground">{typeLabels[type] || type}</span>
                          <span className="text-xs font-heading font-bold text-foreground">{fmt(amount)} <span className="text-muted-foreground font-normal">({share.toFixed(0)}%)</span></span>
                        </div>
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-secondary rounded-full transition-all" style={{ width: `${share}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  {revenueByType.length === 0 && <p className="text-xs text-muted-foreground">Sem receitas no período</p>}
                </div>
              </CardContent>
            </Card>

            {/* Top earners */}
             <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
              <CardContent className="p-5">
                <h3 className="font-heading font-bold text-sm text-foreground mb-4">Top Faturamento</h3>
                <div className="space-y-2.5">
                  {topRevenue.map((item, i) => (
                    <div key={item.desc} className="flex items-center gap-3">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${i < 3 ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"}`}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-heading font-medium text-foreground truncate">{item.desc}</p>
                        <p className="text-[10px] text-muted-foreground">{item.count} venda(s)</p>
                      </div>
                      <span className="text-xs font-heading font-bold text-foreground">{fmt(item.total)}</span>
                    </div>
                  ))}
                  {topRevenue.length === 0 && <p className="text-xs text-muted-foreground">Sem dados</p>}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Expenses breakdown */}
           <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-sm text-foreground">Estrutura de Custos</h3>
                <span className="text-xs text-muted-foreground font-heading">{costRatio.toFixed(0)}% da receita</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
                {expenseByCategory.map(([cat, amount]) => {
                  const share = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
                  return (
                    <div key={cat} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                      <span className="text-xs text-foreground">{expenseCategoryLabels[cat as ExpenseCategory] || cat}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-heading font-bold text-foreground">{fmt(amount)}</span>
                        <span className="text-[10px] text-muted-foreground w-10 text-right">{share.toFixed(0)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Daily flow mini-table */}
           <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
            <CardContent className="p-5">
              <h3 className="font-heading font-bold text-sm text-foreground mb-4">Fluxo de Caixa Diário</h3>
              <div className="max-h-52 overflow-y-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead className="font-heading text-[10px]">Data</TableHead>
                    <TableHead className="font-heading text-[10px] text-right">Entradas</TableHead>
                    <TableHead className="font-heading text-[10px] text-right">Saídas</TableHead>
                    <TableHead className="font-heading text-[10px] text-right">Saldo</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {dailyFlow.map((d) => (
                      <TableRow key={d.date}>
                        <TableCell className="text-xs text-muted-foreground py-1.5">{d.label}</TableCell>
                        <TableCell className="text-xs text-right text-foreground py-1.5">{d.rev > 0 ? fmt(d.rev) : "—"}</TableCell>
                        <TableCell className="text-xs text-right text-foreground py-1.5">{d.exp > 0 ? fmt(d.exp) : "—"}</TableCell>
                        <TableCell className={`text-xs text-right font-bold py-1.5 ${d.net >= 0 ? "text-foreground" : "text-destructive"}`}>{fmt(d.net)}</TableCell>
                      </TableRow>
                    ))}
                    {dailyFlow.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6 text-xs">Sem movimentações</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ===== RECEITAS ===== */}
      {view === "receitas" && (
        <>
           <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5"><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="font-heading text-xs">Data</TableHead>
                <TableHead className="font-heading text-xs">Descrição</TableHead>
                <TableHead className="font-heading text-xs">Tipo</TableHead>
                <TableHead className="font-heading text-xs text-right">Valor</TableHead>
                <TableHead className="font-heading text-xs text-right">Ação</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filteredRev.sort((a, b) => b.date.localeCompare(a.date)).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs text-muted-foreground">{new Date(r.date + "T12:00:00").toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="font-heading text-sm">{r.description}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px] text-foreground border-border">{typeLabels[r.type]}</Badge></TableCell>
                    <TableCell className="text-right font-heading font-bold text-sm">{fmt(r.amount)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setRevEditId(r.id); setRevForm({ description: r.description, type: r.type, amount: r.amount, date: r.date }); setRevDialog(true); }} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => { deleteRevenue(r.id); toast({ title: "Receita removida" }); }} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredRev.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Sem receitas</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
          <div className="flex justify-end"><span className="font-heading font-bold text-foreground">Total: {fmt(totalRevenue)}</span></div>
        </>
      )}

      {/* ===== DESPESAS ===== */}
      {view === "despesas" && (
        <>
          <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5"><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="font-heading text-xs">Data</TableHead>
                <TableHead className="font-heading text-xs">Descrição</TableHead>
                <TableHead className="font-heading text-xs">Categoria</TableHead>
                <TableHead className="font-heading text-xs text-right">Valor</TableHead>
                <TableHead className="font-heading text-xs text-right">Ação</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filteredExp.sort((a, b) => b.date.localeCompare(a.date)).map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-xs text-muted-foreground">{new Date(e.date + "T12:00:00").toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="font-heading text-sm">{e.description}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px] text-foreground border-border">{expenseCategoryLabels[e.category]}</Badge></TableCell>
                    <TableCell className="text-right font-heading font-bold text-sm">{fmt(e.amount)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setExpEditId(e.id); setExpForm({ description: e.description, category: e.category, amount: e.amount, date: e.date }); setExpDialog(true); }} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => { deleteExpense(e.id); toast({ title: "Despesa removida" }); }} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredExp.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Sem despesas</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
          <div className="flex justify-end"><span className="font-heading font-bold text-foreground">Total: {fmt(totalExpenses)}</span></div>
        </>
      )}

      {/* ===== DRE ===== */}
      {view === "dre" && (
         <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
          <CardContent className="p-6">
            <h3 className="font-heading font-bold text-base text-foreground mb-6">Demonstrativo de Resultado — {new Date(period + "-01").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</h3>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm font-bold bg-muted/50 px-3 py-2 rounded-lg">
                <span>Receita Bruta Total</span><span>{fmt(totalRevenueWithBilling)}</span>
              </div>

              {/* Manual revenue */}
              {revenueByType.length > 0 && (
                <div className="flex justify-between text-xs font-semibold text-muted-foreground px-6 py-1 uppercase tracking-wider">
                  <span>Receita Operacional</span><span>{fmt(totalRevenue)}</span>
                </div>
              )}
              {revenueByType.map(([type, amount]) => (
                <div key={type} className="flex justify-between text-sm px-9 py-1">
                  <span className="text-muted-foreground">{typeLabels[type]}</span><span>{fmt(amount)}</span>
                </div>
              ))}

              {/* Billing system revenue */}
              {billingRevenue > 0 && (
                <>
                  <div className="flex justify-between text-xs font-semibold text-muted-foreground px-6 py-1 uppercase tracking-wider">
                    <span>Receita de Cobranças (Sistema)</span><span>{fmt(billingRevenue)}</span>
                  </div>
                  {billingByMethod.map(([method, amount]) => (
                    <div key={method} className="flex justify-between text-sm px-9 py-1">
                      <span className="text-muted-foreground">{methodLabels[method] || method}</span><span>{fmt(amount)}</span>
                    </div>
                  ))}
                </>
              )}

              {/* Pending billing */}
              {billingPending > 0 && (
                <div className="flex justify-between text-sm px-6 py-1.5 bg-yellow-50 rounded-lg">
                  <span className="text-yellow-700 font-medium">Cobranças Pendentes ({billingPendingInvoices.length})</span>
                  <span className="text-yellow-700 font-semibold">{fmt(billingPending)}</span>
                </div>
              )}

              <Separator className="my-2" />
              <div className="flex justify-between text-sm font-bold bg-muted/50 px-3 py-2 rounded-lg">
                <span>(-) Despesas Operacionais</span><span>{fmt(totalExpenses)}</span>
              </div>
              {expenseByCategory.map(([cat, amount]) => (
                <div key={cat} className="flex justify-between text-sm px-6 py-1">
                  <span className="text-muted-foreground">{expenseCategoryLabels[cat as ExpenseCategory]}</span><span>{fmt(amount)}</span>
                </div>
              ))}
              <Separator className="my-2" />
              <div className="flex justify-between text-sm px-3 py-1.5">
                <span className="font-medium">= Lucro Operacional (EBITDA)</span><span className="font-bold">{fmt(totalRevenueWithBilling - totalExpenses)}</span>
              </div>
              <div className="flex justify-between text-sm px-3 py-1.5">
                <span className="text-muted-foreground">(-) Impostos Estimados ({(TAX_RATE * 100).toFixed(0)}%)</span><span>{fmt(taxEstimate)}</span>
              </div>
              <Separator className="my-2" />
              <div className={`flex justify-between text-base font-bold px-3 py-3 rounded-lg ${netProfit >= 0 ? "bg-primary/5" : "bg-destructive/5"}`}>
                <span>= Lucro Líquido</span><span className={netProfit >= 0 ? "text-foreground" : "text-destructive"}>{fmt(netProfit)}</span>
              </div>
              <div className="flex justify-between text-sm px-3 pt-2">
                <span className="text-muted-foreground">Margem Líquida</span><span className="font-heading font-bold">{profitMargin.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== SIMULADOR ===== */}
      {view === "simulador" && (() => {
        const updateItem = (id: string, field: keyof SimItem, value: number | string) =>
          setSimItems((prev) => prev.map((si) => si.id === id ? { ...si, [field]: value } : si));

        const simData = simItems.map((item) => {
          const taxCost = item.sellPrice * TAX_RATE;
          const laborCost = (item.laborMinutes / 60) * LABOR_COST_PER_HOUR;
          const commission = item.sellPrice * (item.commissionPct / 100);
          const totalCostUnit = item.cost + taxCost + item.fixedCostShare + laborCost + commission;
          const unitProfit = item.sellPrice - totalCostUnit;
          const monthlyRevenue = item.sellPrice * item.monthlyQty;
          const monthlyProfit = unitProfit * item.monthlyQty;
          const margin = item.sellPrice > 0 ? (unitProfit / item.sellPrice) * 100 : 0;
          return { ...item, taxCost, laborCost, commission, totalCostUnit, unitProfit, monthlyRevenue, monthlyProfit, margin };
        });
        const totalMonthlyProfit = simData.reduce((s, i) => s + i.monthlyProfit, 0);
        const totalMonthlyRevenue = simData.reduce((s, i) => s + i.monthlyRevenue, 0);
        const totalYearlyProfit = totalMonthlyProfit * 12;

        return (
          <>
            {/* Table — read-only with edit action */}
            <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-heading text-xs">Produto / Procedimento</TableHead>
                        <TableHead className="font-heading text-xs text-right">Preço</TableHead>
                        <TableHead className="font-heading text-xs text-right">Custo Total</TableHead>
                        <TableHead className="font-heading text-xs text-right">Lucro Unit.</TableHead>
                        <TableHead className="font-heading text-xs text-right">Margem</TableHead>
                        <TableHead className="font-heading text-xs text-center">Qtd/Mês</TableHead>
                        <TableHead className="font-heading text-xs text-right">Lucro/Mês</TableHead>
                        <TableHead className="font-heading text-xs text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {simData.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-heading text-sm">{item.name}</TableCell>
                          <TableCell className="text-xs text-right">{fmt(item.sellPrice)}</TableCell>
                          <TableCell className="text-xs text-right text-muted-foreground">{fmt(item.totalCostUnit)}</TableCell>
                          <TableCell className={`text-xs text-right font-bold ${item.unitProfit >= 0 ? "text-foreground" : "text-destructive"}`}>{fmt(item.unitProfit)}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline" className={`text-[10px] ${item.margin >= 30 ? "border-primary text-primary" : item.margin >= 15 ? "border-border text-foreground" : "border-destructive text-destructive"}`}>
                              {item.margin.toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center text-xs">{item.monthlyQty}</TableCell>
                          <TableCell className={`text-xs text-right font-bold ${item.monthlyProfit >= 0 ? "text-foreground" : "text-destructive"}`}>{fmt(item.monthlyProfit)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => openSimEdit(item)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => setSimItems((prev) => prev.filter((si) => si.id !== item.id))} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {simData.length === 0 && (
                        <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8 text-xs">Adicione itens para simular</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Totals */}
            {simData.length > 0 && (
               <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
                <CardContent className="p-5">
                  <p className="text-[10px] text-muted-foreground font-heading uppercase tracking-wider mb-3 text-center">Lucro = Preço − Insumo − Imposto ({(TAX_RATE*100)}%) − Fixo − Mão de Obra (R${LABOR_COST_PER_HOUR}/h) − Comissão</p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground font-heading uppercase tracking-wider mb-1">Receita Mensal</p>
                      <p className="text-base font-heading font-bold text-foreground">{fmt(totalMonthlyRevenue)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-heading uppercase tracking-wider mb-1">Lucro Líquido/Mês</p>
                      <p className={`text-base font-heading font-bold ${totalMonthlyProfit >= 0 ? "text-foreground" : "text-destructive"}`}>{fmt(totalMonthlyProfit)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-heading uppercase tracking-wider mb-1">Lucro Anual</p>
                      <p className={`text-base font-heading font-bold ${totalYearlyProfit >= 0 ? "text-foreground" : "text-destructive"}`}>{fmt(totalYearlyProfit)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        );
      })()}

      {/* ===== COBRANÇAS MP ===== */}
      {view === "cobrancas" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5"><CardContent className="p-4">
              <p className="text-lg font-heading font-bold text-foreground">{mpInvoices.length}</p>
              <p className="text-[10px] text-muted-foreground font-heading uppercase tracking-wider">Faturas</p>
            </CardContent></Card>
            <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5"><CardContent className="p-4">
              <p className="text-lg font-heading font-bold text-foreground">{fmt(mpInvoices.filter((i: any) => i.status === "paid" || i.status === "approved").reduce((s: number, i: any) => s + Number(i.amount), 0))}</p>
              <p className="text-[10px] text-muted-foreground font-heading uppercase tracking-wider">Recebido</p>
            </CardContent></Card>
            <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5"><CardContent className="p-4">
              <p className="text-lg font-heading font-bold text-foreground">{fmt(mpInvoices.filter((i: any) => i.status === "pending").reduce((s: number, i: any) => s + Number(i.amount), 0))}</p>
              <p className="text-[10px] text-muted-foreground font-heading uppercase tracking-wider">Pendente</p>
            </CardContent></Card>
            <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5"><CardContent className="p-4">
              <p className="text-lg font-heading font-bold text-foreground">{mpPayments.length}</p>
              <p className="text-[10px] text-muted-foreground font-heading uppercase tracking-wider">Pagamentos</p>
            </CardContent></Card>
          </div>

          <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
            <CardContent className="p-0">
              <div className="p-4 pb-2"><h3 className="font-heading font-bold text-sm text-foreground">Faturas</h3></div>
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="font-heading text-xs">Status</TableHead>
                  <TableHead className="font-heading text-xs">Descrição</TableHead>
                  <TableHead className="font-heading text-xs">Método</TableHead>
                  <TableHead className="font-heading text-xs text-right">Valor</TableHead>
                  <TableHead className="font-heading text-xs">Vencimento</TableHead>
                  <TableHead className="font-heading text-xs">Criada em</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {mpInvoices.map((inv: any) => (
                    <TableRow key={inv.id}>
                      <TableCell><div className="flex items-center gap-1.5">{mpStatusIcon(inv.status)}<span className="text-xs font-heading">{mpStatusLabel(inv.status)}</span></div></TableCell>
                      <TableCell className="font-heading text-sm max-w-[200px] truncate">{inv.description || "—"}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px] border-border text-foreground">{mpMethodLabel(inv.payment_method)}</Badge></TableCell>
                      <TableCell className="text-right font-heading font-bold text-sm">{fmt(Number(inv.amount))}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{inv.due_date ? new Date(inv.due_date + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(inv.created_at).toLocaleDateString("pt-BR")}</TableCell>
                    </TableRow>
                  ))}
                  {mpInvoices.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8 text-xs">{mpLoading ? "Carregando..." : "Nenhuma fatura encontrada"}</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {mpPayments.length > 0 && (
            <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
              <CardContent className="p-0">
                <div className="p-4 pb-2"><h3 className="font-heading font-bold text-sm text-foreground">Pagamentos Recebidos</h3></div>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead className="font-heading text-xs">Status</TableHead>
                    <TableHead className="font-heading text-xs">Pagador</TableHead>
                    <TableHead className="font-heading text-xs">Método</TableHead>
                    <TableHead className="font-heading text-xs text-right">Valor</TableHead>
                    <TableHead className="font-heading text-xs">Data</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {mpPayments.map((pay: any) => (
                      <TableRow key={pay.id}>
                        <TableCell><div className="flex items-center gap-1.5">{mpStatusIcon(pay.status)}<span className="text-xs font-heading">{mpStatusLabel(pay.mp_status || pay.status)}</span></div></TableCell>
                        <TableCell className="text-sm font-heading">{pay.payer_name || pay.payer_email || "—"}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px] border-border text-foreground">{mpMethodLabel(pay.payment_method)}</Badge></TableCell>
                        <TableCell className="text-right font-heading font-bold text-sm">{fmt(Number(pay.amount))}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(pay.created_at).toLocaleDateString("pt-BR")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Nova Cobrança Dialog */}
      <Dialog open={mpNewDialog} onOpenChange={setMpNewDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-heading">Nova Cobrança — Mercado Pago</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2"><Label className="font-heading">Descrição *</Label><Input value={mpNewForm.description} onChange={(e) => setMpNewForm({ ...mpNewForm, description: e.target.value })} placeholder="Ex: Limpeza de Pele Profunda" className="rounded-xl" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label className="font-heading">Valor (R$) *</Label><Input type="number" step="0.01" value={mpNewForm.amount || ""} onChange={(e) => setMpNewForm({ ...mpNewForm, amount: Number(e.target.value) })} className="rounded-xl" /></div>
              <div className="space-y-2"><Label className="font-heading">Método</Label>
                <Select value={mpNewForm.payment_method} onValueChange={(v) => setMpNewForm({ ...mpNewForm, payment_method: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix"><div className="flex items-center gap-2"><QrCode className="h-3.5 w-3.5" /> PIX</div></SelectItem>
                    <SelectItem value="boleto"><div className="flex items-center gap-2"><FileText className="h-3.5 w-3.5" /> Boleto</div></SelectItem>
                    <SelectItem value="credit_card"><div className="flex items-center gap-2"><CreditCard className="h-3.5 w-3.5" /> Cartão</div></SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label className="font-heading">E-mail do Pagador *</Label><Input type="email" value={mpNewForm.payer_email} onChange={(e) => setMpNewForm({ ...mpNewForm, payer_email: e.target.value })} placeholder="cliente@email.com" className="rounded-xl" /></div>
            <div className="space-y-2"><Label className="font-heading">Nome do Pagador</Label><Input value={mpNewForm.payer_name} onChange={(e) => setMpNewForm({ ...mpNewForm, payer_name: e.target.value })} placeholder="Nome completo (opcional)" className="rounded-xl" /></div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setMpNewDialog(false)} className="flex-1 rounded-full font-heading">Cancelar</Button>
              <Button onClick={handleCreateMpInvoice} disabled={mpCreating} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-heading">
                {mpCreating ? <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" /> : <Zap className="h-4 w-4 mr-1.5" />}
                {mpCreating ? "Gerando..." : "Gerar Cobrança"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* PIX Result Dialog */}
      <Dialog open={!!mpPixResult} onOpenChange={() => setMpPixResult(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle className="font-heading">PIX Gerado</DialogTitle></DialogHeader>
          {mpPixResult && (
            <div className="space-y-4 mt-2 text-center">
              {mpPixResult.qr_code_base64 && (
                <div className="flex justify-center">
                  <img src={`data:image/png;base64,${mpPixResult.qr_code_base64}`} alt="QR Code PIX" className="w-48 h-48 rounded-xl border border-border" />
                </div>
              )}
              {mpPixResult.qr_code && (
                <div className="space-y-2">
                  <p className="text-[10px] text-muted-foreground font-heading uppercase tracking-wider">Código PIX Copia e Cola</p>
                  <div className="flex items-center gap-2">
                    <Input readOnly value={mpPixResult.qr_code} className="rounded-xl text-xs" />
                    <Button size="icon" variant="outline" className="rounded-xl shrink-0" onClick={() => { navigator.clipboard.writeText(mpPixResult.qr_code); toast({ title: "Código copiado!" }); }}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              {mpPixResult.ticket_url && (
                <Button variant="outline" className="rounded-full font-heading w-full" onClick={() => window.open(mpPixResult.ticket_url, "_blank")}>
                  <ExternalLink className="h-4 w-4 mr-1.5" /> Abrir Comprovante
                </Button>
              )}
              <Button onClick={() => setMpPixResult(null)} className="rounded-full font-heading w-full bg-primary text-primary-foreground hover:bg-primary/90">Fechar</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Simulator dialog — create & edit */}
      <Dialog open={simDialog} onOpenChange={setSimDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-heading">{simEditId ? "Editar Item" : "Novo Item"} — Simulador</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2"><Label className="font-heading">Nome *</Label><Input value={simForm.name} onChange={(e) => setSimForm({ ...simForm, name: e.target.value })} placeholder="Ex: Botox" className="rounded-xl" /></div>
            <Separator />
            <p className="text-xs text-muted-foreground font-heading uppercase tracking-wider">Parâmetros de custo</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label className="font-heading">Preço Venda (R$)</Label><Input type="number" step="0.01" value={simForm.sellPrice || ""} onChange={(e) => setSimForm({ ...simForm, sellPrice: Number(e.target.value) })} className="rounded-xl" /></div>
              <div className="space-y-2"><Label className="font-heading">Custo Insumo (R$)</Label><Input type="number" step="0.01" value={simForm.cost || ""} onChange={(e) => setSimForm({ ...simForm, cost: Number(e.target.value) })} className="rounded-xl" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label className="font-heading">Custo Fixo Unit. (R$)</Label><Input type="number" step="0.01" value={simForm.fixedCostShare || ""} onChange={(e) => setSimForm({ ...simForm, fixedCostShare: Number(e.target.value) })} className="rounded-xl" /></div>
              <div className="space-y-2"><Label className="font-heading">Tempo (min)</Label><Input type="number" value={simForm.laborMinutes || ""} onChange={(e) => setSimForm({ ...simForm, laborMinutes: Number(e.target.value) })} className="rounded-xl" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label className="font-heading">Comissão %</Label><Input type="number" step="0.5" value={simForm.commissionPct || ""} onChange={(e) => setSimForm({ ...simForm, commissionPct: Number(e.target.value) })} className="rounded-xl" /></div>
              <div className="space-y-2"><Label className="font-heading">Qtd Mensal</Label><Input type="number" min={1} value={simForm.monthlyQty || ""} onChange={(e) => setSimForm({ ...simForm, monthlyQty: Number(e.target.value) })} className="rounded-xl" /></div>
            </div>
            {/* Live preview */}
            {simForm.sellPrice > 0 && (() => {
              const taxC = simForm.sellPrice * TAX_RATE;
              const laborC = (simForm.laborMinutes / 60) * LABOR_COST_PER_HOUR;
              const commC = simForm.sellPrice * (simForm.commissionPct / 100);
              const totalC = simForm.cost + taxC + simForm.fixedCostShare + laborC + commC;
              const profit = simForm.sellPrice - totalC;
              const mg = (profit / simForm.sellPrice) * 100;
              return (
                <Card className="bg-white/30 backdrop-blur-lg border-white/40">
                  <CardContent className="p-3">
                    <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                      <div><p className="text-muted-foreground">Imposto</p><p className="font-heading font-bold">{fmt(taxC)}</p></div>
                      <div><p className="text-muted-foreground">Mão de Obra</p><p className="font-heading font-bold">{fmt(laborC)}</p></div>
                      <div><p className="text-muted-foreground">Comissão</p><p className="font-heading font-bold">{fmt(commC)}</p></div>
                      <div><p className="text-muted-foreground">Custo Total</p><p className="font-heading font-bold">{fmt(totalC)}</p></div>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-heading font-bold">Lucro Unitário</span>
                      <span className={`text-sm font-heading font-bold ${profit >= 0 ? "text-foreground" : "text-destructive"}`}>{fmt(profit)} <span className="text-[10px] text-muted-foreground">({mg.toFixed(1)}%)</span></span>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setSimDialog(false)} className="flex-1 rounded-full font-heading">Cancelar</Button>
              <Button onClick={handleSimSave} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-heading"><Save className="h-4 w-4 mr-1.5" /> {simEditId ? "Salvar" : "Adicionar"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialogs */}
      <Dialog open={revDialog} onOpenChange={setRevDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-heading">{revEditId ? "Editar Receita" : "Nova Receita"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2"><Label className="font-heading">Descrição *</Label><Input value={revForm.description} onChange={(e) => setRevForm({ ...revForm, description: e.target.value })} placeholder="Ex: Limpeza de Pele (x5)" className="rounded-xl" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label className="font-heading">Tipo</Label>
                <Select value={revForm.type} onValueChange={(v: RevenueEntry["type"]) => setRevForm({ ...revForm, type: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="servico">Procedimento</SelectItem><SelectItem value="produto">Produto Vendido</SelectItem>
                    <SelectItem value="programa">Programa Online</SelectItem><SelectItem value="parceria">Parceria</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label className="font-heading">Valor (R$) *</Label><Input type="number" step="0.01" value={revForm.amount || ""} onChange={(e) => setRevForm({ ...revForm, amount: Number(e.target.value) })} className="rounded-xl" /></div>
            </div>
            <div className="space-y-2"><Label className="font-heading">Data</Label><Input type="date" value={revForm.date} onChange={(e) => setRevForm({ ...revForm, date: e.target.value })} className="rounded-xl" /></div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setRevDialog(false)} className="flex-1 rounded-full font-heading">Cancelar</Button>
              <Button onClick={handleSaveRevenue} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-heading"><Save className="h-4 w-4 mr-1.5" /> {revEditId ? "Salvar" : "Adicionar"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={expDialog} onOpenChange={setExpDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-heading">{expEditId ? "Editar Despesa" : "Nova Despesa"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2"><Label className="font-heading">Descrição *</Label><Input value={expForm.description} onChange={(e) => setExpForm({ ...expForm, description: e.target.value })} placeholder="Ex: Aluguel sala - Março" className="rounded-xl" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label className="font-heading">Categoria</Label>
                <Select value={expForm.category} onValueChange={(v: ExpenseCategory) => setExpForm({ ...expForm, category: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(expenseCategoryLabels).map(([k, l]) => (<SelectItem key={k} value={k}>{l}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label className="font-heading">Valor (R$) *</Label><Input type="number" step="0.01" value={expForm.amount || ""} onChange={(e) => setExpForm({ ...expForm, amount: Number(e.target.value) })} className="rounded-xl" /></div>
            </div>
            <div className="space-y-2"><Label className="font-heading">Data</Label><Input type="date" value={expForm.date} onChange={(e) => setExpForm({ ...expForm, date: e.target.value })} className="rounded-xl" /></div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setExpDialog(false)} className="flex-1 rounded-full font-heading">Cancelar</Button>
              <Button onClick={handleSaveExpense} className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full font-heading"><Save className="h-4 w-4 mr-1.5" /> {expEditId ? "Salvar" : "Adicionar"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== CONFIG RECEBIMENTO ===== */}
      {view === "config_recebimento" && <PaymentConfigTab />}
    </div>
  );
};
