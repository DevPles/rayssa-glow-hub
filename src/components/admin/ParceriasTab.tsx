import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Search, Building2, Stethoscope, FlaskConical, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";

export type PartnerType = "clinica" | "laboratorio" | "medico" | "enfermeiro";

export interface Partner {
  id: string;
  name: string;
  type: PartnerType;
  specialty: string;
  email: string;
  phone: string;
  address: string;
  crm_coren: string;
  observations: string;
  active: boolean;
  createdAt: string;
}

const partnerTypeMeta: Record<PartnerType, { label: string; icon: typeof Building2; color: string }> = {
  clinica: { label: "Clínica", icon: Building2, color: "bg-blue-100 text-blue-800 border-blue-300" },
  laboratorio: { label: "Laboratório", icon: FlaskConical, color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  medico: { label: "Médico(a)", icon: Stethoscope, color: "bg-purple-100 text-purple-800 border-purple-300" },
  enfermeiro: { label: "Enfermeiro(a)", icon: Users, color: "bg-pink-100 text-pink-800 border-pink-300" },
};

const initialPartners: Partner[] = [
  {
    id: "p1", name: "Clínica São Lucas", type: "clinica", specialty: "Obstetrícia e Ginecologia",
    email: "contato@saolucas.com", phone: "(11) 3333-1111", address: "Av. Paulista, 1000 - São Paulo",
    crm_coren: "", observations: "Parceria para exames de imagem e ultrassonografia", active: true, createdAt: "2025-10-01",
  },
  {
    id: "p2", name: "Laboratório Fleury", type: "laboratorio", specialty: "Análises Clínicas",
    email: "parcerias@fleury.com", phone: "(11) 3333-2222", address: "Rua das Análises, 500 - São Paulo",
    crm_coren: "", observations: "Exames laboratoriais com desconto para gestantes", active: true, createdAt: "2025-11-15",
  },
  {
    id: "p3", name: "Dr. Carlos Mendes", type: "medico", specialty: "Obstetra",
    email: "carlos.mendes@med.com", phone: "(11) 99999-3333", address: "",
    crm_coren: "CRM 123456/SP", observations: "Obstetra referência para partos humanizados", active: true, createdAt: "2025-09-01",
  },
  {
    id: "p4", name: "Enf. Patrícia Lima", type: "enfermeiro", specialty: "Enfermeira Obstetra",
    email: "patricia.lima@enf.com", phone: "(11) 99999-4444", address: "",
    crm_coren: "COREN 654321/SP", observations: "Atendimento domiciliar pós-parto", active: true, createdAt: "2026-01-10",
  },
];

const emptyForm: Omit<Partner, "id" | "createdAt"> = {
  name: "", type: "medico", specialty: "", email: "", phone: "", address: "",
  crm_coren: "", observations: "", active: true,
};

export const ParceriasTab = () => {
  const [partners, setPartners] = useState<Partner[]>(initialPartners);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(() => {
    let result = partners;
    if (filterType !== "all") result = result.filter((p) => p.type === filterType);
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(s) || p.specialty.toLowerCase().includes(s) || p.email.toLowerCase().includes(s));
    }
    return result;
  }, [partners, filterType, search]);

  const stats = useMemo(() => ({
    total: partners.length,
    clinicas: partners.filter((p) => p.type === "clinica").length,
    laboratorios: partners.filter((p) => p.type === "laboratorio").length,
    profissionais: partners.filter((p) => p.type === "medico" || p.type === "enfermeiro").length,
  }), [partners]);

  const openNew = () => { setForm({ ...emptyForm }); setEditingId(null); setDialogOpen(true); };
  const openEdit = (p: Partner) => {
    setForm({ name: p.name, type: p.type, specialty: p.specialty, email: p.email, phone: p.phone, address: p.address, crm_coren: p.crm_coren, observations: p.observations, active: p.active });
    setEditingId(p.id); setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) { toast({ title: "Preencha o nome", variant: "destructive" }); return; }
    if (editingId) {
      setPartners((prev) => prev.map((p) => p.id === editingId ? { ...p, ...form } : p));
      toast({ title: "Parceria atualizada!" });
    } else {
      setPartners((prev) => [...prev, { id: `p${Date.now()}`, createdAt: new Date().toISOString().split("T")[0], ...form }]);
      toast({ title: "Parceria cadastrada!" });
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setPartners((prev) => prev.filter((p) => p.id !== id));
    toast({ title: "Parceria removida" });
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    return parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : parts[0]?.[0] || "?";
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Users, label: "Total", value: stats.total, accent: "text-foreground" },
          { icon: Building2, label: "Clínicas", value: stats.clinicas, accent: "text-blue-600" },
          { icon: FlaskConical, label: "Laboratórios", value: stats.laboratorios, accent: "text-emerald-600" },
          { icon: Stethoscope, label: "Profissionais", value: stats.profissionais, accent: "text-purple-600" },
        ].map((s) => (
          <Card key={s.label} className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-muted/60">
                <s.icon className={`h-4 w-4 ${s.accent}`} />
              </div>
              <div>
                <p className={`text-xl font-heading font-bold ${s.accent}`}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + Filter + Add */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar parceiro..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-xl" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="rounded-xl w-[180px]">
            <SelectValue placeholder="Filtrar tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="clinica">Clínicas</SelectItem>
            <SelectItem value="laboratorio">Laboratórios</SelectItem>
            <SelectItem value="medico">Médicos</SelectItem>
            <SelectItem value="enfermeiro">Enfermeiros</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={openNew} className="rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-heading gap-1.5 shadow-md shadow-secondary/20 ml-auto">
          <Plus className="h-4 w-4" /> Nova Parceria
        </Button>
      </div>

      {/* Cards */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-muted-foreground font-heading">Nenhuma parceria encontrada</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((p) => {
            const meta = partnerTypeMeta[p.type];
            const Icon = meta.icon;
            return (
              <Card key={p.id} className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5 hover:shadow-xl transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${meta.color.split(" ").slice(0, 2).join(" ")}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <h3 className="font-heading font-bold text-sm text-foreground truncate">{p.name}</h3>
                        <Badge variant="outline" className={`text-[10px] font-heading border ${meta.color}`}>{meta.label}</Badge>
                        {!p.active && <Badge variant="secondary" className="text-[10px]">Inativo</Badge>}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        {p.specialty && <span>{p.specialty}</span>}
                        {p.crm_coren && <span className="font-mono">{p.crm_coren}</span>}
                        {p.phone && <span className="hidden sm:inline">{p.phone}</span>}
                      </div>
                      {p.observations && (
                        <p className="text-xs text-muted-foreground mt-1 truncate max-w-md">{p.observations}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEdit(p)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-secondary/10">
                <Building2 className="h-4 w-4 text-secondary" />
              </div>
              {editingId ? "Editar Parceria" : "Nova Parceria"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label className="font-heading text-xs">Nome *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl" placeholder="Nome do parceiro" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-heading text-xs">Tipo</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as PartnerType })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clinica">Clínica</SelectItem>
                    <SelectItem value="laboratorio">Laboratório</SelectItem>
                    <SelectItem value="medico">Médico(a)</SelectItem>
                    <SelectItem value="enfermeiro">Enfermeiro(a)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="font-heading text-xs">Especialidade</Label>
                <Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} className="rounded-xl" placeholder="Ex: Obstetrícia" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-heading text-xs">E-mail</Label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-xl" placeholder="email@parceiro.com" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-heading text-xs">Telefone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-xl" placeholder="(00) 00000-0000" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-heading text-xs">CRM / COREN</Label>
                <Input value={form.crm_coren} onChange={(e) => setForm({ ...form, crm_coren: e.target.value })} className="rounded-xl" placeholder="CRM/COREN" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-heading text-xs">Status</Label>
                <Select value={form.active ? "true" : "false"} onValueChange={(v) => setForm({ ...form, active: v === "true" })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Ativo</SelectItem>
                    <SelectItem value="false">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label className="font-heading text-xs">Endereço</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="rounded-xl" placeholder="Endereço completo" />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label className="font-heading text-xs">Observações</Label>
                <Textarea value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} className="rounded-xl min-h-[60px]" placeholder="Detalhes da parceria..." />
              </div>
            </div>
            <Button onClick={handleSave} className="w-full rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-heading shadow-md shadow-secondary/20">
              {editingId ? "Salvar Alterações" : "Cadastrar Parceria"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
