import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usePOPs, type POPDocument } from "@/contexts/POPContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import logoImg from "@/assets/logo.png";
import { useSystemSettings } from "@/contexts/SystemSettingsContext";

const emptyForm: Omit<POPDocument, "id"> = {
  name: "", description: "", patientName: "", patientCpf: "", materials: [], techniques: [], steps: [], observations: "",
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
};

const POPsPanel = () => {
  const { pops, addPOP, updatePOP, deletePOP } = usePOPs();
  const { users } = useAuth();
  const { settings: sysSettings } = useSystemSettings();
  const patients = users.filter((u) => u.role === "cliente");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<POPDocument, "id">>(emptyForm);
  const [newMaterial, setNewMaterial] = useState("");
  const [newTechnique, setNewTechnique] = useState("");
  const [newStep, setNewStep] = useState("");
  const [viewPOP, setViewPOP] = useState<POPDocument | null>(null);

  const filtered = pops.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const openNew = () => {
    setEditingId(null);
    setForm({ ...emptyForm, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    setDialogOpen(true);
  };

  const openEdit = (pop: POPDocument) => {
    setEditingId(pop.id);
    const { id, ...rest } = pop;
    setForm(rest);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name) { toast({ title: "Informe o nome do POP", variant: "destructive" }); return; }
    if (editingId) {
      updatePOP(editingId, form);
      toast({ title: "POP atualizado!" });
    } else {
      addPOP(form);
      toast({ title: "POP cadastrado!" });
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    deletePOP(id);
    toast({ title: "POP removido" });
  };

  const addToList = (field: "materials" | "techniques" | "steps", value: string, setter: (v: string) => void) => {
    if (!value.trim()) return;
    setForm((prev) => ({ ...prev, [field]: [...prev[field], value.trim()] }));
    setter("");
  };

  const removeFromList = (field: "materials" | "techniques" | "steps", index: number) => {
    setForm((prev) => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  };

  const handlePrint = (pop: POPDocument) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const logoSrc = new URL(logoImg, window.location.origin).href;

    printWindow.document.write(`
      <html>
        <head>
          <title>POP - ${pop.name}</title>
          <style>
            @page { size: A4; margin: 12mm 14mm; }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; font-size: 11px; line-height: 1.4; }
            .page { max-width: 100%; }
            .brand { display: flex; align-items: center; gap: 12px; padding-bottom: 10px; border-bottom: 2px solid #7c3aed; margin-bottom: 12px; }
            .brand img { height: 42px; object-fit: contain; border: none; outline: none; }
            .brand-text { flex: 1; }
            .brand-text h1 { font-size: 14px; color: #7c3aed; font-weight: 700; }
            .brand-text p { font-size: 9px; color: #888; margin-top: 1px; }
            .brand .date { font-size: 9px; color: #888; text-align: right; white-space: nowrap; }
            .pop-title { font-size: 16px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px; }
            .client-info { background: #f8f7ff; border: 1px solid #e9e5ff; border-radius: 6px; padding: 8px 12px; margin-bottom: 10px; display: flex; gap: 24px; }
            .client-info span { font-size: 11px; }
            .client-info strong { color: #7c3aed; }
            .description { font-size: 11px; color: #444; margin-bottom: 10px; line-height: 1.5; }
            .columns { display: flex; gap: 16px; margin-bottom: 10px; }
            .col { flex: 1; }
            h2 { font-size: 11px; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; margin-bottom: 4px; padding-bottom: 2px; border-bottom: 1px solid #e9e5ff; }
            ul { padding-left: 14px; margin: 0; }
            li { font-size: 10.5px; line-height: 1.6; }
            .steps { margin-bottom: 8px; }
            .steps li { font-size: 10.5px; line-height: 1.6; }
            .obs { background: #f5f3ff; padding: 8px 10px; border-radius: 6px; margin-bottom: 12px; }
            .obs h2 { border: none; margin-bottom: 2px; }
            .obs p { font-size: 10px; color: #555; }
            .signatures { display: flex; gap: 32px; margin-top: 14px; padding-top: 12px; border-top: 1.5px solid #ddd; }
            .sig-block { flex: 1; }
            .sig-block p { font-size: 10px; color: #555; margin-bottom: 3px; }
            .sig-block .sig-name { font-size: 11px; font-weight: 600; color: #1a1a1a; }
            .sig-line { border-bottom: 1px solid #999; height: 28px; margin: 6px 0 4px; }
            @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="brand">
              <img src="${logoSrc}" alt="Logo" />
              <div class="brand-text">
                <h1>${sysSettings.companyName}</h1>
                <p>Procedimento Operacional Padrão (POP)</p>
              </div>
              <div class="date">
                ${format(new Date(pop.updatedAt), "dd/MM/yyyy", { locale: ptBR })}
              </div>
            </div>

            <p class="pop-title">${pop.name}</p>

            ${pop.patientName ? `
            <div class="client-info">
              <span><strong>Cliente:</strong> ${pop.patientName}</span>
              ${pop.patientCpf ? `<span><strong>CPF:</strong> ${pop.patientCpf}</span>` : ""}
            </div>` : ""}

            <p class="description">${pop.description}</p>

            <div class="columns">
              <div class="col">
                <h2>Materiais</h2>
                <ul>${pop.materials.map((m) => `<li>${m}</li>`).join("")}</ul>
              </div>
              <div class="col">
                <h2>Técnicas</h2>
                <ul>${pop.techniques.map((t) => `<li>${t}</li>`).join("")}</ul>
              </div>
            </div>

            <div class="steps">
              <h2>Passo a Passo</h2>
              <ul>${pop.steps.map((s) => `<li>${s}</li>`).join("")}</ul>
            </div>

            ${pop.observations ? `<div class="obs"><h2>Observações</h2><p>${pop.observations}</p></div>` : ""}

            <div class="signatures">
              <div class="sig-block">
                <p class="sig-name">${pop.patientName || "Paciente"}</p>
                ${pop.patientCpf ? `<p>CPF: ${pop.patientCpf}</p>` : ""}
                <div class="sig-line"></div>
                <p>Assinatura da Paciente</p>
                <p>Data: ____/____/________</p>
              </div>
              <div class="sig-block">
                <p class="sig-name">${sysSettings.companyShortName}</p>
                <p>COREN-SP: _______________</p>
                <div class="sig-line"></div>
                <p>Assinatura da Profissional</p>
                <p>Data: ____/____/________</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);
  };

  // ===== VIEW DETAIL =====
  if (viewPOP) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button onClick={() => setViewPOP(null)} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full font-heading text-sm">← Voltar</Button>
          <div className="flex gap-2">
            <Button onClick={() => handlePrint(viewPOP)} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full font-heading text-sm">
              Imprimir
            </Button>
            <Button onClick={() => { openEdit(viewPOP); setViewPOP(null); }} variant="outline" className="rounded-full font-heading text-sm">
              Editar
            </Button>
          </div>
        </div>

         <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
          <CardContent className="p-6 space-y-5">
            <div>
              <h2 className="font-heading font-bold text-lg text-foreground">{viewPOP.name}</h2>
              {viewPOP.patientName && (
                <p className="text-sm text-foreground mt-1 font-heading">Cliente: <span className="font-semibold">{viewPOP.patientName}</span>{viewPOP.patientCpf && <span className="text-muted-foreground"> — CPF: {viewPOP.patientCpf}</span>}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">Atualizado: {format(new Date(viewPOP.updatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{viewPOP.description}</p>

            <Separator />

            <div>
              <h3 className="font-heading font-semibold text-sm text-foreground mb-2">Materiais Necessários</h3>
              <div className="flex flex-wrap gap-2">
                {viewPOP.materials.map((m, i) => (
                  <Badge key={i} variant="outline" className="font-heading text-xs">{m}</Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-heading font-semibold text-sm text-foreground mb-2">Técnicas Utilizadas</h3>
              <div className="flex flex-wrap gap-2">
                {viewPOP.techniques.map((t, i) => (
                  <Badge key={i} variant="secondary" className="font-heading text-xs">{t}</Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-heading font-semibold text-sm text-foreground mb-2">Passo a Passo</h3>
              <div className="space-y-1.5">
                {viewPOP.steps.map((s, i) => (
                  <p key={i} className="text-sm text-foreground pl-2 border-l-2 border-secondary/50">{s}</p>
                ))}
              </div>
            </div>

            {viewPOP.observations && (
              <div className="bg-white/30 backdrop-blur-lg rounded-xl p-4">
                <h3 className="font-heading font-semibold text-sm text-foreground mb-1">Observações</h3>
                <p className="text-sm text-muted-foreground">{viewPOP.observations}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ===== LIST =====
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Input placeholder="Buscar POP..." value={search} onChange={(e) => setSearch(e.target.value)} className="rounded-xl max-w-sm" />
        <Button onClick={openNew} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full font-heading shadow-md shadow-secondary/20">
          Novo POP
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { value: pops.length, label: "Total de POPs" },
          { value: pops.filter(p => p.materials.length > 0).length, label: "Com Materiais" },
          { value: pops.filter(p => p.steps.length > 0).length, label: "Com Passo a Passo" },
        ].map((s) => (
          <Card key={s.label} className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5"><CardContent className="p-4 text-center">
            <p className="text-2xl font-heading font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </CardContent></Card>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5"><CardContent className="p-8 text-center">
            <p className="text-sm text-muted-foreground font-heading">Nenhum POP encontrado</p>
          </CardContent></Card>
        ) : filtered.map((pop) => (
          <Card key={pop.id} className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5 hover:shadow-xl transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-bold text-foreground text-sm">{pop.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{pop.description}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10px] text-muted-foreground">{pop.materials.length} material(is)</span>
                    <span className="text-[10px] text-muted-foreground">{pop.steps.length} etapa(s)</span>
                    <span className="text-[10px] text-muted-foreground">Atualizado: {format(new Date(pop.updatedAt), "dd/MM/yyyy", { locale: ptBR })}</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="ghost" className="text-xs font-heading" onClick={() => setViewPOP(pop)}>Ver</Button>
                  <Button size="sm" variant="ghost" className="text-xs font-heading" onClick={() => handlePrint(pop)}>Imprimir</Button>
                  <Button size="sm" variant="ghost" className="text-xs font-heading" onClick={() => openEdit(pop)}>Editar</Button>
                  <Button size="sm" variant="ghost" className="text-xs font-heading hover:text-destructive" onClick={() => handleDelete(pop.id)}>Excluir</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog for new/edit POP */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">{editingId ? "Editar POP" : "Novo POP"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="font-heading">Nome do Procedimento *</Label>
              <Input placeholder="Ex: Limpeza de Pele Profunda" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl" />
            </div>
             <div className="space-y-2">
              <Label className="font-heading">Descrição</Label>
              <Textarea placeholder="Descreva o procedimento..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl min-h-[60px]" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-heading">Cliente (Paciente)</Label>
                <Select value={form.patientName} onValueChange={(v) => {
                  setForm({ ...form, patientName: v });
                }}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione a paciente" /></SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-heading">CPF da Paciente</Label>
                <Input placeholder="000.000.000-00" value={form.patientCpf} onChange={(e) => setForm({ ...form, patientCpf: e.target.value })} className="rounded-xl" />
              </div>
            </div>

            <Separator />

            {/* Materials */}
            <div className="space-y-2">
              <Label className="font-heading">Materiais Necessários</Label>
              {form.materials.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.materials.map((m, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 bg-muted rounded-full px-3 py-1.5 text-xs text-foreground font-heading">
                      {m}
                      <button type="button" onClick={() => removeFromList("materials", i)} className="text-muted-foreground hover:text-destructive transition-colors">×</button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input placeholder="Adicionar material..." value={newMaterial} onChange={(e) => setNewMaterial(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addToList("materials", newMaterial, setNewMaterial); } }}
                  className="rounded-xl flex-1" />
                <Button type="button" size="sm" onClick={() => addToList("materials", newMaterial, setNewMaterial)} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-xl">+</Button>
              </div>
            </div>

            {/* Techniques */}
            <div className="space-y-2">
              <Label className="font-heading">Técnicas Utilizadas</Label>
              {form.techniques.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.techniques.map((t, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 bg-secondary/10 rounded-full px-3 py-1.5 text-xs text-foreground font-heading">
                      {t}
                      <button type="button" onClick={() => removeFromList("techniques", i)} className="text-muted-foreground hover:text-destructive transition-colors">×</button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input placeholder="Adicionar técnica..." value={newTechnique} onChange={(e) => setNewTechnique(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addToList("techniques", newTechnique, setNewTechnique); } }}
                  className="rounded-xl flex-1" />
                <Button type="button" size="sm" onClick={() => addToList("techniques", newTechnique, setNewTechnique)} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-xl">+</Button>
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-2">
              <Label className="font-heading">Passo a Passo</Label>
              {form.steps.length > 0 && (
                <div className="space-y-1.5">
                  {form.steps.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                      <span className="text-xs text-foreground font-heading flex-1">{s}</span>
                      <button type="button" onClick={() => removeFromList("steps", i)} className="text-muted-foreground hover:text-destructive transition-colors text-xs">×</button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input placeholder="Adicionar etapa..." value={newStep} onChange={(e) => setNewStep(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addToList("steps", newStep, setNewStep); } }}
                  className="rounded-xl flex-1" />
                <Button type="button" size="sm" onClick={() => addToList("steps", newStep, setNewStep)} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-xl">+</Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="font-heading">Observações</Label>
              <Textarea placeholder="Contraindicações, cuidados especiais..." value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} className="rounded-xl min-h-[60px]" />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1 rounded-full font-heading">Cancelar</Button>
              <Button onClick={handleSave} className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full font-heading shadow-md shadow-secondary/20">
                {editingId ? "Salvar" : "Cadastrar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default POPsPanel;
