import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useSystemSettings, type Tenant } from "@/contexts/SystemSettingsContext";

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

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string) => new Date(d).toLocaleDateString("pt-BR");

export function ConsolidatedBillingView() {
  const { tenants } = useSystemSettings();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterTenant, setFilterTenant] = useState<string>("all");
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: invData }, { data: subData }] = await Promise.all([
      supabase.from("invoices").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("subscriptions").select("*").order("created_at", { ascending: false }),
    ]);
    setInvoices(invData || []);
    setSubscriptions(subData || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const tenantMap = useMemo(() => {
    const map: Record<string, Tenant> = {};
    tenants.forEach(t => { map[t.id] = t; });
    return map;
  }, [tenants]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      if (filterStatus !== "all" && inv.status !== filterStatus) return false;
      if (filterTenant !== "all" && inv.tenant_id !== filterTenant) return false;
      if (search) {
        const term = search.toLowerCase();
        const tName = tenantMap[inv.tenant_id]?.name?.toLowerCase() || "";
        const desc = (inv.description || "").toLowerCase();
        if (!tName.includes(term) && !desc.includes(term)) return false;
      }
      return true;
    });
  }, [invoices, filterStatus, filterTenant, search, tenantMap]);

  // KPIs
  const totalReceived = invoices
    .filter(i => i.status === "paid" || i.status === "approved")
    .reduce((s, i) => s + Number(i.amount), 0);
  const totalPending = invoices
    .filter(i => i.status === "pending" || i.status === "overdue")
    .reduce((s, i) => s + Number(i.amount), 0);
  const activeSubs = subscriptions.filter(s => s.status === "active").length;
  const mrrEstimate = subscriptions
    .filter(s => s.status === "active")
    .reduce((s, sub) => s + Number(sub.amount), 0);

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-card/50 backdrop-blur-xl border-border/30 rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-xl font-bold text-foreground">{fmt(totalReceived)}</p>
            <p className="text-xs text-muted-foreground">Total Recebido</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-xl border-border/30 rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-xl font-bold text-yellow-600">{fmt(totalPending)}</p>
            <p className="text-xs text-muted-foreground">Pendente</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-xl border-border/30 rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-xl font-bold text-foreground">{activeSubs}</p>
            <p className="text-xs text-muted-foreground">Assinaturas Ativas</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-xl border-border/30 rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-xl font-bold text-primary">{fmt(mrrEstimate)}</p>
            <p className="text-xs text-muted-foreground">MRR Estimado</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar cliente ou descrição..."
          className="rounded-xl max-w-xs flex-1"
        />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="rounded-xl w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="paid">Pago</SelectItem>
            <SelectItem value="overdue">Vencida</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterTenant} onValueChange={setFilterTenant}>
          <SelectTrigger className="rounded-xl w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Clientes</SelectItem>
            {tenants.map(t => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="rounded-xl" onClick={fetchData} disabled={loading}>
          {loading ? "..." : "Atualizar"}
        </Button>
      </div>

      {/* Invoices table */}
      <Card className="bg-card/50 backdrop-blur-xl border-border/30 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-xs font-medium">Cliente</TableHead>
                <TableHead className="text-xs font-medium">Descrição</TableHead>
                <TableHead className="text-xs font-medium">Método</TableHead>
                <TableHead className="text-xs font-medium">Vencimento</TableHead>
                <TableHead className="text-xs font-medium text-right">Valor</TableHead>
                <TableHead className="text-xs font-medium text-center">Status</TableHead>
                <TableHead className="text-xs font-medium">Pago em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((inv) => {
                const st = statusMap[inv.status] || statusMap.pending;
                const tenant = tenantMap[inv.tenant_id];
                return (
                  <TableRow key={inv.id} className="hover:bg-muted/20">
                    <TableCell className="text-sm font-medium">{tenant?.name || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{inv.description || "Mensalidade"}</TableCell>
                    <TableCell className="text-xs">{(inv.payment_method || "—").toUpperCase()}</TableCell>
                    <TableCell className="text-xs">{inv.due_date ? fmtDate(inv.due_date) : "—"}</TableCell>
                    <TableCell className="text-sm font-semibold text-right">{fmt(Number(inv.amount))}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={`text-[10px] border-0 ${st.cls}`}>{st.label}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{inv.paid_at ? fmtDate(inv.paid_at) : "—"}</TableCell>
                  </TableRow>
                );
              })}
              {filteredInvoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8 text-xs">
                    {loading ? "Carregando..." : "Nenhuma fatura encontrada."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Subscriptions summary */}
      {subscriptions.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Assinaturas</p>
          <Card className="bg-card/50 backdrop-blur-xl border-border/30 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs font-medium">Cliente</TableHead>
                    <TableHead className="text-xs font-medium">Método</TableHead>
                    <TableHead className="text-xs font-medium">Dia Venc.</TableHead>
                    <TableHead className="text-xs font-medium text-right">Valor</TableHead>
                    <TableHead className="text-xs font-medium text-center">Status</TableHead>
                    <TableHead className="text-xs font-medium">Início</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((sub) => {
                    const st = statusMap[sub.status] || statusMap.pending;
                    const tenant = tenantMap[sub.tenant_id];
                    return (
                      <TableRow key={sub.id} className="hover:bg-muted/20">
                        <TableCell className="text-sm font-medium">{tenant?.name || "—"}</TableCell>
                        <TableCell className="text-xs">{(sub.payment_method || "—").toUpperCase()}</TableCell>
                        <TableCell className="text-xs">{sub.billing_day || "—"}</TableCell>
                        <TableCell className="text-sm font-semibold text-right">{fmt(Number(sub.amount))}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={`text-[10px] border-0 ${st.cls}`}>{st.label}</Badge>
                        </TableCell>
                        <TableCell className="text-xs">{sub.started_at ? fmtDate(sub.started_at) : "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
