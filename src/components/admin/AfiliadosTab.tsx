import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export type AfiliadaTier = "Bronze" | "Prata" | "Ouro" | "Diamante";

export interface AfiliadaItemConfig {
  itemId: string;
  commission: number;
  discount: number;
}

export interface Afiliada {
  id: string;
  name: string;
  email: string;
  phone: string;
  tier: AfiliadaTier;
  items: AfiliadaItemConfig[];
  totalSales: number;
  totalRevenue: number;
  createdAt: string;
}

interface ServiceItem {
  id: string;
  title: string;
  price: number;
  page: string;
  category?: string;
}

const tierConfig: Record<AfiliadaTier, { label: string; color: string; bg: string; border: string; defaultCommission: number; defaultDiscount: number }> = {
  Bronze: { label: "Bronze", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", defaultCommission: 10, defaultDiscount: 5 },
  Prata: { label: "Prata", color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200", defaultCommission: 15, defaultDiscount: 8 },
  Ouro: { label: "Ouro", color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200", defaultCommission: 20, defaultDiscount: 12 },
  Diamante: { label: "Diamante", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", defaultCommission: 30, defaultDiscount: 15 },
};

const tiers: AfiliadaTier[] = ["Bronze", "Prata", "Ouro", "Diamante"];

const pageLabels: Record<string, string> = {
  "estetica-avancada": "Estética Avançada",
  "nucleo-materno": "Núcleo Materno",
  "produtos-programas": "Produtos & Programas",
  
};

const formatPrice = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface AfiliadosTabProps {
  users: { id: string; name: string; email: string; role: string }[];
  services: ServiceItem[];
}

type FormState = {
  name: string;
  email: string;
  phone: string;
  tier: AfiliadaTier;
  items: AfiliadaItemConfig[];
  totalSales: number;
  totalRevenue: number;
  createdAt: string;
};

const emptyForm: FormState = {
  name: "", email: "", phone: "", tier: "Bronze",
  items: [], totalSales: 0, totalRevenue: 0, createdAt: "",
};

const initialAfiliadas: Afiliada[] = [
  { id: "af1", name: "Ana Souza", email: "ana@email.com", phone: "(11) 99999-0001", tier: "Bronze", items: [], totalSales: 5, totalRevenue: 1200, createdAt: "2026-01-15" },
  { id: "af2", name: "Juliana Ferreira", email: "juliana@email.com", phone: "(11) 99999-0002", tier: "Prata", items: [], totalSales: 22, totalRevenue: 4800, createdAt: "2025-11-20" },
];

export const AfiliadosTab = ({ services }: AfiliadosTabProps) => {
  const [afiliadas, setAfiliadas] = useState<Afiliada[]>(initialAfiliadas);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [search, setSearch] = useState("");
  const [filterTier, setFilterTier] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [selectedPage, setSelectedPage] = useState<string>("all");

  // Group services by page
  const servicesByPage = services.reduce((acc, s) => {
    const page = s.page || "outros";
    if (!acc[page]) acc[page] = [];
    acc[page].push(s);
    return acc;
  }, {} as Record<string, ServiceItem[]>);

  const availablePages = Object.keys(servicesByPage);

  const openNew = () => {
    setEditingId(null);
    setForm({ ...emptyForm, createdAt: new Date().toISOString().slice(0, 10) });
    setSelectedPage("all");
    setDialogOpen(true);
  };

  const openEdit = (af: Afiliada) => {
    setEditingId(af.id);
    setForm({
      name: af.name, email: af.email, phone: af.phone, tier: af.tier,
      items: [...af.items], totalSales: af.totalSales, totalRevenue: af.totalRevenue, createdAt: af.createdAt,
    });
    setSelectedPage("all");
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.email) {
      toast({ title: "Preencha nome e e-mail", variant: "destructive" });
      return;
    }
    if (editingId) {
      setAfiliadas(prev => prev.map(a => a.id === editingId ? { ...a, ...form } : a));
      toast({ title: "Afiliada atualizada!" });
    } else {
      setAfiliadas(prev => [...prev, { id: `af${Date.now()}`, ...form }]);
      toast({ title: "Afiliada cadastrada!" });
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setAfiliadas(prev => prev.filter(a => a.id !== id));
    toast({ title: "Afiliada removida" });
  };

  const handleTierChange = (tier: AfiliadaTier) => {
    setForm(prev => ({ ...prev, tier }));
  };

  const isItemSelected = (itemId: string) => form.items.some(i => i.itemId === itemId);

  const getItemConfig = (itemId: string): AfiliadaItemConfig | undefined =>
    form.items.find(i => i.itemId === itemId);

  const toggleItem = (itemId: string) => {
    const tierDefaults = tierConfig[form.tier];
    setForm(prev => {
      if (prev.items.some(i => i.itemId === itemId)) {
        return { ...prev, items: prev.items.filter(i => i.itemId !== itemId) };
      }
      return {
        ...prev,
        items: [...prev.items, { itemId, commission: tierDefaults.defaultCommission, discount: tierDefaults.defaultDiscount }],
      };
    });
  };

  const updateItemField = (itemId: string, field: "commission" | "discount", value: number) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.map(i => i.itemId === itemId ? { ...i, [field]: value } : i),
    }));
  };

  const selectAllOnPage = (page: string) => {
    const tierDefaults = tierConfig[form.tier];
    const pageItems = servicesByPage[page] || [];
    setForm(prev => {
      const existingIds = new Set(prev.items.map(i => i.itemId));
      const newItems = pageItems
        .filter(s => !existingIds.has(s.id))
        .map(s => ({ itemId: s.id, commission: tierDefaults.defaultCommission, discount: tierDefaults.defaultDiscount }));
      return { ...prev, items: [...prev.items, ...newItems] };
    });
  };

  const clearAllOnPage = (page: string) => {
    const pageItemIds = new Set((servicesByPage[page] || []).map(s => s.id));
    setForm(prev => ({
      ...prev,
      items: prev.items.filter(i => !pageItemIds.has(i.itemId)),
    }));
  };

  const filtered = afiliadas
    .filter(a => {
      const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase());
      const matchTier = filterTier === "all" || a.tier === filterTier;
      return matchSearch && matchTier;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "sales": return b.totalSales - a.totalSales;
        case "products": return b.items.length - a.items.length;
        case "revenue": return b.totalRevenue - a.totalRevenue;
        default: return a.name.localeCompare(b.name);
      }
    });

  const tierCounts = tiers.reduce((acc, t) => {
    acc[t] = afiliadas.filter(a => a.tier === t).length;
    return acc;
  }, {} as Record<string, number>);

  // Services to show in dialog based on selected page
  const filteredServices = selectedPage === "all"
    ? services
    : services.filter(s => s.page === selectedPage);

  // Group filtered services by category
  const groupedServices = filteredServices.reduce((acc, s) => {
    const cat = s.category || "Outros";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {} as Record<string, ServiceItem[]>);

  const selectedCount = form.items.length;

  return (
    <div className="space-y-6">
      {/* Tier summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tiers.map(tier => {
          const t = tierConfig[tier];
          return (
            <button
              key={tier}
              onClick={() => setFilterTier(filterTier === tier ? "all" : tier)}
              className={`rounded-xl border p-3 text-center transition-all ${filterTier === tier ? `${t.border} ${t.bg} shadow-sm` : "border-border/50 hover:border-border"}`}
            >
              <p className={`font-heading font-bold text-sm ${t.color}`}>{tier}</p>
              <p className="text-xl font-heading font-bold text-foreground">{tierCounts[tier]}</p>
              <p className="text-[10px] text-muted-foreground">{t.defaultCommission}% com. · {t.defaultDiscount}% desc.</p>
            </button>
          );
        })}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 flex-1 min-w-[200px]">
          <Input placeholder="Buscar afiliada..." value={search} onChange={e => setSearch(e.target.value)} className="rounded-xl" />
          <Select value={filterTier} onValueChange={setFilterTier}>
            <SelectTrigger className="w-[130px] rounded-xl">
              <SelectValue placeholder="Nível" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {tiers.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px] rounded-xl">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nome</SelectItem>
              <SelectItem value="sales">Mais vendas</SelectItem>
              <SelectItem value="products">Mais produtos</SelectItem>
              <SelectItem value="revenue">Maior receita</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openNew} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-heading rounded-full px-5">
          <Plus className="h-4 w-4 mr-1.5" /> Nova Afiliada
        </Button>
      </div>

      {/* Table */}
      <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-heading">Nome</TableHead>
              <TableHead className="font-heading">E-mail</TableHead>
              <TableHead className="font-heading">Nível</TableHead>
              <TableHead className="font-heading text-center">Produtos</TableHead>
              <TableHead className="font-heading text-center">Vendas</TableHead>
              <TableHead className="font-heading text-right">Receita</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">
                  Nenhuma afiliada encontrada
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(af => {
                const tier = tierConfig[af.tier];
                return (
                  <TableRow key={af.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openEdit(af)}>
                    <TableCell className="font-heading font-semibold text-sm">{af.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{af.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${tier.bg} ${tier.color} ${tier.border}`}>{af.tier}</Badge>
                    </TableCell>
                    <TableCell className="text-center text-sm">{af.items.length}</TableCell>
                    <TableCell className="text-center text-sm">{af.totalSales}</TableCell>
                    <TableCell className="text-right text-sm font-heading">{formatPrice(af.totalRevenue)}</TableCell>
                    <TableCell>
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(af.id); }}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">{editingId ? "Editar Afiliada" : "Cadastrar Afiliada"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Basic info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="font-heading text-xs">Nome *</Label>
                <Input placeholder="Nome completo" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-heading text-xs">E-mail *</Label>
                <Input placeholder="email@exemplo.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="font-heading text-xs">Telefone</Label>
                <Input placeholder="(00) 00000-0000" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-heading text-xs">Nível</Label>
                <Select value={form.tier} onValueChange={v => handleTierChange(v as AfiliadaTier)}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {tiers.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Product selection by page */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-heading font-bold text-sm text-foreground">
                  Produtos & Serviços <span className="text-muted-foreground font-normal text-xs">({selectedCount} selecionados)</span>
                </span>
              </div>

              {/* Page filter */}
              <div className="flex gap-2 flex-wrap mb-4">
                <button
                  onClick={() => setSelectedPage("all")}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${selectedPage === "all" ? "bg-primary text-primary-foreground border-primary" : "border-border/50 hover:border-border text-muted-foreground"}`}
                >
                  Todas
                </button>
                {availablePages.map(page => (
                  <button
                    key={page}
                    onClick={() => setSelectedPage(page)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${selectedPage === page ? "bg-primary text-primary-foreground border-primary" : "border-border/50 hover:border-border text-muted-foreground"}`}
                  >
                    {pageLabels[page] || page}
                  </button>
                ))}
              </div>

              {/* Select all / clear for current page */}
              {selectedPage !== "all" && (
                <div className="flex gap-2 text-[10px] mb-3">
                  <button className="text-primary hover:underline" onClick={() => selectAllOnPage(selectedPage)}>Selecionar todos</button>
                  <span className="text-muted-foreground">·</span>
                  <button className="text-muted-foreground hover:underline" onClick={() => clearAllOnPage(selectedPage)}>Limpar</button>
                </div>
              )}

              {/* Product list grouped by category */}
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                {Object.entries(groupedServices).map(([category, items]) => (
                  <div key={category}>
                    <p className="text-[10px] font-heading font-bold text-muted-foreground uppercase tracking-wider mb-2">{category}</p>
                    <div className="space-y-1.5">
                      {items.map(s => {
                        const selected = isItemSelected(s.id);
                        const config = getItemConfig(s.id);
                        return (
                          <div key={s.id} className={`rounded-xl border p-3 transition-all ${selected ? "border-primary/40 bg-primary/5" : "border-border/40 hover:bg-muted/30"}`}>
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={selected}
                                onCheckedChange={() => toggleItem(s.id)}
                              />
                              <span className="text-xs font-medium text-foreground flex-1 truncate">{s.title}</span>
                              <span className="text-[10px] text-muted-foreground shrink-0">{formatPrice(s.price)}</span>
                            </div>
                            {selected && config && (
                              <div className="flex gap-3 mt-2 ml-6">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-muted-foreground">Comissão:</span>
                                  <Input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={config.commission}
                                    onChange={e => updateItemField(s.id, "commission", Number(e.target.value))}
                                    className="h-7 w-16 text-xs rounded-lg text-center"
                                  />
                                  <span className="text-[10px] text-muted-foreground">%</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-muted-foreground">Desconto:</span>
                                  <Input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={config.discount}
                                    onChange={e => updateItemField(s.id, "discount", Number(e.target.value))}
                                    className="h-7 w-16 text-xs rounded-lg text-center"
                                  />
                                  <span className="text-[10px] text-muted-foreground">%</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />
            <Button onClick={handleSave} className="w-full rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90 font-heading">
              {editingId ? "Salvar Alterações" : "Cadastrar Afiliada"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
