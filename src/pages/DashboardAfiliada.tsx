import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut, Copy, Share2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useServices } from "@/contexts/ServicesContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Tab = "visao-geral" | "produtos" | "vendas" | "rede";

const levelConfig = {
  Bronze: { color: "text-amber-700", bg: "bg-amber-100", border: "border-amber-300", next: "Prata", target: 20, icon: "🥉" },
  Prata: { color: "text-gray-500", bg: "bg-gray-100", border: "border-gray-300", next: "Ouro", target: 50, icon: "🥈" },
  Ouro: { color: "text-yellow-600", bg: "bg-yellow-100", border: "border-yellow-300", next: "Diamante", target: 100, icon: "🥇" },
  Diamante: { color: "text-blue-500", bg: "bg-blue-100", border: "border-blue-300", next: null, target: null, icon: "💎" },
};

const mockRede = [
  { name: "Juliana F.", level: "Bronze", sales: 5, joined: "Jan/2026" },
  { name: "Patrícia L.", level: "Bronze", sales: 3, joined: "Fev/2026" },
  { name: "Renata S.", level: "Bronze", sales: 8, joined: "Dez/2025" },
];

const formatPrice = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const DashboardAfiliada = () => {
  const { user, logout } = useAuth();
  const { services } = useServices();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("visao-geral");
  const [affiliateSales, setAffiliateSales] = useState<any[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);

  const referralCode = user ? `RL-${user.id.slice(-4).toUpperCase()}` : "";
  const baseUrl = window.location.origin;

  // Fetch affiliate sales from invoices
  useEffect(() => {
    if (!referralCode) return;
    const fetchSales = async () => {
      setLoadingSales(true);
      try {
        const { data } = await supabase
          .from("invoices")
          .select("*")
          .eq("type", "product")
          .order("created_at", { ascending: false });

        // Filter by affiliate code in metadata
        const filtered = (data || []).filter((inv: any) => {
          const meta = inv.metadata as any;
          return meta?.affiliate_code === referralCode;
        });
        setAffiliateSales(filtered);
      } catch (err) {
        console.error("Error fetching affiliate sales:", err);
      } finally {
        setLoadingSales(false);
      }
    };
    fetchSales();
  }, [referralCode]);

  // Products available (only with price > 0)
  const availableProducts = useMemo(() => services.filter(s => s.price > 0), [services]);

  // Group products by page/category
  const productsByCategory = useMemo(() => {
    return availableProducts.reduce((acc, s) => {
      const cat = s.category || "Outros";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(s);
      return acc;
    }, {} as Record<string, typeof availableProducts>);
  }, [availableProducts]);

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  if (!user) return null;

  const handleLogout = () => { logout(); navigate("/"); };
  const currentLevel = "Bronze" as keyof typeof levelConfig;
  const level = levelConfig[currentLevel];

  // Commission rate based on level
  const commissionRate = currentLevel === "Diamante" ? 30 : currentLevel === "Ouro" ? 20 : currentLevel === "Prata" ? 15 : 10;

  // Stats from real sales
  const paidSales = affiliateSales.filter(s => s.status === "paid");
  const pendingSales = affiliateSales.filter(s => s.status === "pending");
  const totalSalesCount = affiliateSales.length;
  const totalRevenue = paidSales.reduce((s, inv) => s + Number(inv.amount), 0);
  const totalCommission = totalRevenue * (commissionRate / 100);
  const pendingCommission = pendingSales.reduce((s, inv) => s + Number(inv.amount), 0) * (commissionRate / 100);

  const copyLink = (productId?: string) => {
    const link = `${baseUrl}/ref/${referralCode}${productId ? `?p=${productId}` : ""}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Link copiado!", description: "Compartilhe com suas clientes." });
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "visao-geral", label: "Visão Geral" },
    { key: "produtos", label: "Catálogo" },
    { key: "vendas", label: "Vendas" },
    { key: "rede", label: "Minha Rede" },
  ];


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button size="icon" className="rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <div>
              <h1 className="font-heading font-bold text-lg text-foreground">Painel Afiliada</h1>
              <p className="text-xs text-muted-foreground">Olá, {user.name}!</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 ${level.border} ${level.bg} shadow-sm`}>
              <span className="text-2xl leading-none">{level.icon}</span>
              <span className={`font-heading font-bold text-sm ${level.color}`}>{currentLevel}</span>
            </div>
            <Button onClick={handleLogout} className="rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
              <LogOut className="h-4 w-4 mr-2" /> Sair
            </Button>
          </div>
        </div>
        {/* Tabs */}
        <div className="container mx-auto px-4 flex gap-2 pb-3 pt-2 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-xs font-heading font-medium rounded-full transition-all whitespace-nowrap ${
                tab === t.key
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-secondary/20 hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* ========== VISÃO GERAL ========== */}
        {tab === "visao-geral" && (
          <div className="space-y-6">
            {/* Referral code */}
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground font-heading">Seu código de indicação</p>
                <p className="text-2xl font-heading font-bold text-foreground">{referralCode}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="rounded-full font-heading text-sm" onClick={() => { navigator.clipboard.writeText(referralCode); toast({ title: "Código copiado!" }); }}>
                  <Copy className="h-4 w-4 mr-1.5" /> Código
                </Button>
                <Button className="rounded-full font-heading text-sm bg-secondary text-secondary-foreground hover:bg-secondary/90" onClick={() => copyLink()}>
                  <Share2 className="h-4 w-4 mr-1.5" /> Link geral
                </Button>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border border-border/50">
                <CardContent className="p-4 text-center">
                  <span className="text-2xl font-heading font-bold text-foreground">{totalSalesCount}</span>
                  <p className="text-xs text-muted-foreground">Vendas Totais</p>
                </CardContent>
              </Card>
              <Card className="border border-border/50">
                <CardContent className="p-4 text-center">
                  <span className="text-2xl font-heading font-bold text-foreground">{formatPrice(totalCommission)}</span>
                  <p className="text-xs text-muted-foreground">Comissão ({commissionRate}%)</p>
                </CardContent>
              </Card>
              <Card className="border border-border/50">
                <CardContent className="p-4 text-center">
                  <span className="text-2xl font-heading font-bold text-foreground">{formatPrice(totalRevenue)}</span>
                  <p className="text-xs text-muted-foreground">Receita Gerada</p>
                </CardContent>
              </Card>
              <Card className="border border-border/50">
                <CardContent className="p-4 text-center">
                  <span className="text-2xl font-heading font-bold text-foreground">{formatPrice(pendingCommission)}</span>
                  <p className="text-xs text-muted-foreground">Comissão Pendente</p>
                </CardContent>
              </Card>
            </div>

            {/* Level progress */}
            <Card className="border border-border/50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-heading font-bold text-foreground">Progressão de Nível</h3>
                  <Badge variant="outline" className={`${level.bg} ${level.color} ${level.border}`}>{level.icon} {currentLevel}</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{totalSalesCount} vendas realizadas</span>
                    {level.next && <span>Próximo: {level.next} ({level.target} vendas)</span>}
                  </div>
                  <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all"
                      style={{ width: `${level.target ? Math.min((totalSalesCount / level.target) * 100, 100) : 100}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {level.next ? `Faltam ${(level.target || 0) - totalSalesCount} vendas para o nível ${level.next}` : "Nível máximo atingido! 🎉"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Recent sales */}
            <Card className="border border-border/50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-bold text-foreground">Últimas Vendas</h3>
                  <button onClick={() => setTab("vendas")} className="text-xs text-primary font-heading hover:underline">Ver todas</button>
                </div>
                {affiliateSales.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhuma venda ainda. Compartilhe seus links!</p>
                ) : (
                  <div className="space-y-3">
                    {affiliateSales.slice(0, 3).map((sale) => {
                      const meta = sale.metadata as any;
                      return (
                        <div key={sale.id} className="flex items-center justify-between gap-3 py-2 border-b border-border/30 last:border-0">
                          <div className="min-w-0">
                            <p className="font-heading text-sm font-semibold text-foreground truncate">{meta?.product_title || sale.description}</p>
                            <p className="text-[11px] text-muted-foreground">{meta?.payer_name || "—"} • {new Date(sale.created_at).toLocaleDateString("pt-BR")}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-heading font-bold text-foreground">{formatPrice(Number(sale.amount) * commissionRate / 100)}</p>
                            <Badge variant="outline" className={`text-[10px] ${sale.status === "paid" ? "bg-green-50 text-green-600 border-green-200" : "bg-yellow-50 text-yellow-600 border-yellow-200"}`}>
                              {sale.status === "paid" ? "Pago" : "Pendente"}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick actions */}
            <div className="grid sm:grid-cols-2 gap-4">
              <Card className="border border-border/50 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setTab("produtos")}>
                <CardContent className="p-5">
                  <h4 className="font-heading font-bold text-foreground text-sm">Catálogo de Produtos</h4>
                  <p className="text-xs text-muted-foreground">{availableProducts.length} produtos com link de pagamento</p>
                </CardContent>
              </Card>
              <Card className="border border-border/50 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setTab("vendas")}>
                <CardContent className="p-5">
                  <h4 className="font-heading font-bold text-foreground text-sm">Minhas Vendas</h4>
                  <p className="text-xs text-muted-foreground">{affiliateSales.length} vendas registradas via Mercado Pago</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ========== CATÁLOGO ========== */}
        {tab === "produtos" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-bold text-lg text-foreground">Catálogo de Produtos</h2>
              <p className="text-sm text-muted-foreground">{availableProducts.length} produtos</p>
            </div>

            {Object.entries(productsByCategory).map(([category, products]) => (
              <div key={category} className="space-y-3">
                <h3 className="font-heading font-bold text-sm text-muted-foreground uppercase tracking-wider">{category}</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((p) => (
                    <Card key={p.id} className="border border-border/50 hover:shadow-md transition-shadow">
                      <CardContent className="p-5">
                        <div className="mb-3">
                          <h4 className="font-heading font-bold text-sm text-foreground">{p.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>
                        </div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex-1 bg-muted/50 rounded-lg p-2 text-center">
                            <p className="text-[10px] text-muted-foreground">Preço</p>
                            <p className="font-heading font-bold text-sm text-foreground">{formatPrice(p.price)}</p>
                          </div>
                          <div className="flex-1 bg-muted/50 rounded-lg p-2 text-center">
                            <p className="text-[10px] text-muted-foreground">Comissão</p>
                            <p className="font-heading font-bold text-sm text-primary">{commissionRate}%</p>
                          </div>
                          <div className="flex-1 bg-muted/50 rounded-lg p-2 text-center">
                            <p className="text-[10px] text-muted-foreground">Você ganha</p>
                            <p className="font-heading font-bold text-sm text-foreground">{formatPrice(p.price * commissionRate / 100)}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => copyLink(p.id)}
                            className="flex-1 rounded-full font-heading text-xs bg-secondary text-secondary-foreground hover:bg-secondary/90"
                          >
                            <Share2 className="h-3.5 w-3.5 mr-1.5" /> Copiar link
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`${baseUrl}/ref/${referralCode}?p=${p.id}`, "_blank")}
                            className="rounded-full font-heading text-xs"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ========== VENDAS ========== */}
        {tab === "vendas" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-bold text-lg text-foreground">Histórico de Vendas</h2>
              <div className="flex items-center gap-3">
                <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
                  <p className="text-[10px] text-green-600">Pago</p>
                  <p className="font-heading font-bold text-green-700 text-sm">{formatPrice(paidSales.reduce((s, inv) => s + Number(inv.amount) * commissionRate / 100, 0))}</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-1.5">
                  <p className="text-[10px] text-yellow-600">Pendente</p>
                  <p className="font-heading font-bold text-yellow-700 text-sm">{formatPrice(pendingCommission)}</p>
                </div>
              </div>
            </div>

            {loadingSales ? (
              <p className="text-sm text-muted-foreground text-center py-8">Carregando vendas...</p>
            ) : affiliateSales.length === 0 ? (
              <Card className="border border-border/50">
                <CardContent className="p-8 text-center space-y-3">
                  <p className="text-3xl">📊</p>
                  <p className="font-heading font-bold text-foreground">Nenhuma venda ainda</p>
                  <p className="text-sm text-muted-foreground">Compartilhe seus links de produto para começar a vender!</p>
                  <Button onClick={() => setTab("produtos")} className="rounded-full font-heading text-sm bg-secondary text-secondary-foreground hover:bg-secondary/90">
                    Ver catálogo
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {affiliateSales.map((sale) => {
                  const meta = sale.metadata as any;
                  return (
                    <Card key={sale.id} className="border border-border/50">
                      <CardContent className="p-4 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-heading font-semibold text-sm text-foreground">{meta?.product_title || sale.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {meta?.payer_name || "—"} • {new Date(sale.created_at).toLocaleDateString("pt-BR")}
                            {sale.payment_method && ` • ${sale.payment_method.toUpperCase()}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Valor</p>
                            <p className="text-sm font-heading font-semibold text-foreground">{formatPrice(Number(sale.amount))}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Comissão</p>
                            <p className="text-sm font-heading font-bold text-primary">{formatPrice(Number(sale.amount) * commissionRate / 100)}</p>
                          </div>
                          <Badge variant="outline" className={`text-[10px] ${sale.status === "paid" ? "bg-green-50 text-green-600 border-green-200" : "bg-yellow-50 text-yellow-600 border-yellow-200"}`}>
                            {sale.status === "paid" ? "✓ Pago" : "⏳ Pendente"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========== REDE ========== */}
        {tab === "rede" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-bold text-lg text-foreground">Minha Rede</h2>
              <p className="text-sm text-muted-foreground">{mockRede.length} afiliadas</p>
            </div>

            <Card className="border border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
              <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-heading font-bold text-foreground">Convide novas afiliadas</h4>
                  <p className="text-xs text-muted-foreground mt-1">Ganhe bônus por cada afiliada ativa na sua rede.</p>
                </div>
                <Button onClick={() => copyLink()} className="rounded-full font-heading text-sm bg-secondary text-secondary-foreground hover:bg-secondary/90">
                  <Share2 className="h-4 w-4 mr-1.5" /> Compartilhar link
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {mockRede.map((m, i) => (
                <Card key={i} className="border border-border/50">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-sm font-heading font-bold text-foreground">{m.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-heading font-semibold text-sm text-foreground">{m.name}</p>
                        <p className="text-xs text-muted-foreground">Desde {m.joined}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">🥉 {m.level}</Badge>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Vendas</p>
                        <p className="font-heading font-bold text-sm text-foreground">{m.sales}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardAfiliada;
