import { useState } from "react";
import { Package, Boxes, Plus, Pencil, Trash2, Save, X, Search, AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { useServices, pages } from "@/contexts/ServicesContext";

type StockType = "produto" | "material";

interface StockItem {
  id: string;
  name: string;
  type: StockType;
  category: string;
  quantity: number;
  minQuantity: number;
  unit: string;
  costPrice: number;
  linkedServiceId?: string;
}

const initialStock: StockItem[] = [
  { id: "st1", name: "Sérum Vitamina C", type: "produto", category: "Cosméticos Profissionais", quantity: 45, minQuantity: 10, unit: "un", costPrice: 89 },
  { id: "st2", name: "Hidratante Facial Anti-Idade", type: "produto", category: "Cosméticos Profissionais", quantity: 32, minQuantity: 8, unit: "un", costPrice: 72 },
  { id: "st3", name: "Protetor Solar FPS 60", type: "produto", category: "Cosméticos Profissionais", quantity: 58, minQuantity: 15, unit: "un", costPrice: 38 },
  { id: "st4", name: "Óleo Corporal Nutritivo", type: "produto", category: "Cosméticos Profissionais", quantity: 25, minQuantity: 10, unit: "un", costPrice: 52 },
  { id: "st5", name: "Kit Gestante Essencial", type: "produto", category: "Kits Maternidade", quantity: 12, minQuantity: 5, unit: "un", costPrice: 120 },
  { id: "st6", name: "Kit Pós-Parto Recuperação", type: "produto", category: "Kits Maternidade", quantity: 8, minQuantity: 5, unit: "un", costPrice: 135 },
  { id: "st7", name: "Colar Ponto de Luz", type: "produto", category: "Semijoias", quantity: 20, minQuantity: 5, unit: "un", costPrice: 45 },
  { id: "st8", name: "Brinco Argola Cravejada", type: "produto", category: "Semijoias", quantity: 30, minQuantity: 8, unit: "un", costPrice: 35 },
  { id: "mt1", name: "Agulhas para Microagulhamento", type: "material", category: "Insumos Faciais", quantity: 200, minQuantity: 50, unit: "un", costPrice: 8 },
  { id: "mt2", name: "Ácido Hialurônico Profissional", type: "material", category: "Insumos Faciais", quantity: 15, minQuantity: 5, unit: "ml", costPrice: 120 },
  { id: "mt3", name: "Cera Depilatória Quente", type: "material", category: "Insumos Corporais", quantity: 4, minQuantity: 5, unit: "kg", costPrice: 65 },
  { id: "mt4", name: "Óleo de Massagem Profissional", type: "material", category: "Insumos Corporais", quantity: 8, minQuantity: 3, unit: "L", costPrice: 45 },
  { id: "mt5", name: "Gel Condutor Radiofrequência", type: "material", category: "Insumos Corporais", quantity: 6, minQuantity: 3, unit: "L", costPrice: 38 },
  { id: "mt6", name: "Luvas Descartáveis", type: "material", category: "Descartáveis", quantity: 500, minQuantity: 100, unit: "un", costPrice: 0.3 },
  { id: "mt7", name: "Lençol Descartável TNT", type: "material", category: "Descartáveis", quantity: 80, minQuantity: 30, unit: "un", costPrice: 1.2 },
];

const emptyItem: Omit<StockItem, "id"> = {
  name: "", type: "produto", category: "", quantity: 0, minQuantity: 0, unit: "un", costPrice: 0,
};

const formatPrice = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const EstoqueTab = () => {
  const { services } = useServices();
  const [stock, setStock] = useState<StockItem[]>(initialStock);
  const [viewType, setViewType] = useState<"all" | "produto" | "material">("all");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<StockItem, "id">>(emptyItem);
  const [adjustDialog, setAdjustDialog] = useState<string | null>(null);
  const [adjustQty, setAdjustQty] = useState(0);

  const filtered = stock
    .filter((i) => viewType === "all" || i.type === viewType)
    .filter((i) => i.name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase()));

  const lowStock = stock.filter((i) => i.quantity <= i.minQuantity);
  const totalProducts = stock.filter((i) => i.type === "produto").length;
  const totalMaterials = stock.filter((i) => i.type === "material").length;
  const totalValue = stock.reduce((sum, i) => sum + i.quantity * i.costPrice, 0);

  const openNew = (type: StockType) => {
    setEditingId(null);
    setForm({ ...emptyItem, type });
    setDialogOpen(true);
  };

  const openEdit = (item: StockItem) => {
    setEditingId(item.id);
    setForm({ name: item.name, type: item.type, category: item.category, quantity: item.quantity, minQuantity: item.minQuantity, unit: item.unit, costPrice: item.costPrice, linkedServiceId: item.linkedServiceId });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.category) {
      toast({ title: "Preencha nome e categoria", variant: "destructive" });
      return;
    }
    if (editingId) {
      setStock((prev) => prev.map((i) => (i.id === editingId ? { ...i, ...form } : i)));
      toast({ title: "Item atualizado!" });
    } else {
      setStock((prev) => [...prev, { id: `st${Date.now()}`, ...form }]);
      toast({ title: "Item adicionado ao estoque!" });
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setStock((prev) => prev.filter((i) => i.id !== id));
    toast({ title: "Item removido do estoque" });
  };

  const handleAdjust = () => {
    if (!adjustDialog) return;
    setStock((prev) => prev.map((i) => (i.id === adjustDialog ? { ...i, quantity: Math.max(0, i.quantity + adjustQty) } : i)));
    toast({ title: adjustQty > 0 ? "Entrada registrada!" : "Saída registrada!", description: `${Math.abs(adjustQty)} unidade(s)` });
    setAdjustDialog(null);
    setAdjustQty(0);
  };

  const getStatusBadge = (item: StockItem) => {
    if (item.quantity === 0) return <Badge variant="destructive" className="text-[10px]">Esgotado</Badge>;
    if (item.quantity <= item.minQuantity) return <Badge variant="outline" className="text-[10px] border-orange-400 text-orange-600 bg-orange-50">Baixo</Badge>;
    return <Badge variant="outline" className="text-[10px] border-emerald-400 text-emerald-600 bg-emerald-50">OK</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
          <CardContent className="p-4">
            <p className="text-2xl font-heading font-bold text-foreground">{totalProducts}</p>
            <p className="text-[10px] text-muted-foreground font-heading uppercase tracking-wider">Produtos</p>
          </CardContent>
        </Card>
        <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
          <CardContent className="p-4">
            <p className="text-2xl font-heading font-bold text-foreground">{totalMaterials}</p>
            <p className="text-[10px] text-muted-foreground font-heading uppercase tracking-wider">Materiais</p>
          </CardContent>
        </Card>
        <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
          <CardContent className="p-4">
            <p className="text-2xl font-heading font-bold text-foreground">{lowStock.length}</p>
            <p className="text-[10px] text-muted-foreground font-heading uppercase tracking-wider">Estoque Baixo</p>
          </CardContent>
        </Card>
        <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
          <CardContent className="p-4">
            <p className="text-2xl font-heading font-bold text-foreground">{formatPrice(totalValue)}</p>
            <p className="text-[10px] text-muted-foreground font-heading uppercase tracking-wider">Valor Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {(["all", "produto", "material"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setViewType(t)}
              className={`text-sm px-4 py-2 rounded-full font-heading transition-all ${viewType === t ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary/20"}`}
            >
              {t === "all" ? "Todos" : t === "produto" ? "Produtos" : "Materiais"}
            </button>
          ))}
          <div className="relative ml-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar item..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-full h-9 w-52 text-sm"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => openNew("produto")} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full text-sm font-heading">
            <Plus className="h-4 w-4 mr-1" /> Produto
          </Button>
          <Button onClick={() => openNew("material")} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full text-sm font-heading">
            <Plus className="h-4 w-4 mr-1" /> Material
          </Button>
        </div>
      </div>

      {/* Stock Table */}
      <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-heading text-xs">Item</TableHead>
                <TableHead className="font-heading text-xs">Tipo</TableHead>
                <TableHead className="font-heading text-xs">Categoria</TableHead>
                <TableHead className="font-heading text-xs text-center">Qtd</TableHead>
                <TableHead className="font-heading text-xs text-center">Mín</TableHead>
                <TableHead className="font-heading text-xs text-center">Un</TableHead>
                <TableHead className="font-heading text-xs text-right">Custo Un.</TableHead>
                <TableHead className="font-heading text-xs text-center">Status</TableHead>
                <TableHead className="font-heading text-xs text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-heading font-medium text-sm">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${item.type === "produto" ? "border-primary/40 text-foreground bg-primary/10" : "border-muted-foreground/40 text-foreground bg-muted"}`}>
                      {item.type === "produto" ? "Produto" : "Material"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{item.category}</TableCell>
                  <TableCell className="text-center font-heading font-bold">{item.quantity}</TableCell>
                  <TableCell className="text-center text-xs text-muted-foreground">{item.minQuantity}</TableCell>
                  <TableCell className="text-center text-xs text-muted-foreground">{item.unit}</TableCell>
                  <TableCell className="text-right text-xs">{formatPrice(item.costPrice)}</TableCell>
                  <TableCell className="text-center">{getStatusBadge(item)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setAdjustDialog(item.id); setAdjustQty(0); }}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Ajustar estoque"
                      >
                        <TrendingDown className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">Nenhum item encontrado</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">{editingId ? "Editar Item" : `Novo ${form.type === "produto" ? "Produto" : "Material"}`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="font-heading">Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome do item" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="font-heading">Tipo</Label>
              <Select value={form.type} onValueChange={(v: StockType) => setForm({ ...form, type: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="produto">Produto (venda)</SelectItem>
                  <SelectItem value="material">Material (uso interno)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-heading">Categoria *</Label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ex: Cosméticos, Descartáveis..." className="rounded-xl" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="font-heading">Quantidade</Label>
                <Input type="number" value={form.quantity || ""} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="font-heading">Qtd Mínima</Label>
                <Input type="number" value={form.minQuantity || ""} onChange={(e) => setForm({ ...form, minQuantity: Number(e.target.value) })} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="font-heading">Unidade</Label>
                <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="un">un</SelectItem>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="L">L</SelectItem>
                    <SelectItem value="ml">ml</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="cx">cx</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-heading">Custo Unitário (R$)</Label>
              <Input type="number" step="0.01" value={form.costPrice || ""} onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })} className="rounded-xl" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1 rounded-full font-heading">Cancelar</Button>
              <Button onClick={handleSave} className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full font-heading">
                <Save className="h-4 w-4 mr-1.5" /> {editingId ? "Salvar" : "Adicionar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Adjust Stock Dialog */}
      <Dialog open={!!adjustDialog} onOpenChange={() => { setAdjustDialog(null); setAdjustQty(0); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Ajustar Estoque</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              Item: <strong>{stock.find((i) => i.id === adjustDialog)?.name}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Estoque atual: <strong>{stock.find((i) => i.id === adjustDialog)?.quantity} {stock.find((i) => i.id === adjustDialog)?.unit}</strong>
            </p>
            <Separator />
            <div className="space-y-2">
              <Label className="font-heading">Quantidade (positivo = entrada, negativo = saída)</Label>
              <Input type="number" value={adjustQty || ""} onChange={(e) => setAdjustQty(Number(e.target.value))} placeholder="Ex: 10 ou -5" className="rounded-xl" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setAdjustDialog(null)} className="flex-1 rounded-full font-heading">Cancelar</Button>
              <Button onClick={handleAdjust} disabled={adjustQty === 0} className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full font-heading">
                <Save className="h-4 w-4 mr-1.5" /> Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
