import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const partnerTypeMeta: Record<PartnerType, { label: string }> = {
  clinica: { label: "Clínica" },
  laboratorio: { label: "Laboratório" },
  medico: { label: "Médico(a)" },
  enfermeiro: { label: "Enfermeiro(a)" },
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
          { label: "Total", value: stats.total },
          { label: "Clínicas", value: stats.clinicas },
          { label: "Laboratórios", value: stats.laboratorios },
          { label: "Profissionais", value: stats.profissionais },
        ].map((s) => (
          <Card key={s.label} className="bg-card/60 backdrop-blur border-border/40">
            <CardContent className="p-4">
              <p className="text-2xl font-heading font-bold text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + Filter + Add */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Input
          placeholder="Buscar parceiro..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:min-w-[200px] sm:max-w-sm sm:flex-1 rounded-xl"
        />
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full rounded-xl sm:w-[180px]">
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
        <Button variant="secondary" onClick={openNew} className="w-full sm:ml-auto sm:w-auto">
          Nova Parceria
        </Button>
      </div>

      {/* Cards */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card className="bg-card/60 backdrop-blur border-border/40">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-muted-foreground">Nenhuma parceria encontrada</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((p) => {
            const meta = partnerTypeMeta[p.type];
            return (
              <Card key={p.id} className="bg-card/60 backdrop-blur border-border/40 hover:bg-card/80 transition-colors">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-heading font-bold text-xs bg-muted text-muted-foreground">
                        {getInitials(p.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="font-heading font-bold text-sm text-foreground truncate">{p.name}</span>
                          <Badge variant="outline" className="text-[10px] font-heading border-border text-muted-foreground">{meta.label}</Badge>
                          {!p.active && <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">Inativo</Badge>}
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
                    </div>
                    <div className="flex w-full justify-end gap-2 md:w-auto">
                      <Button type="button" variant="outline" size="sm" onClick={() => openEdit(p)}>
                        Editar
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => handleDelete(p.id)}>
                        Excluir
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
            <DialogTitle className="font-heading">
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
            <Button variant="secondary" onClick={handleSave} className="w-full font-heading">
              {editingId ? "Salvar Alterações" : "Cadastrar Parceria"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
