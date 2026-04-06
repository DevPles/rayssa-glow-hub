import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useClinicalRecords, createEmptyRecord, emptyGestationalCard, type ClinicalRecord, type PrenatalConsultation, type GestationalExam, type AssignedProfessional } from "@/contexts/ClinicalRecordContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type View = "list" | "form" | "detail";

const handleFileUpload = (accept: string, onFiles: (urls: string[]) => void) => {
  const input = document.createElement("input");
  input.type = "file"; input.accept = accept; input.multiple = true;
  input.onchange = (e) => {
    const files = (e.target as HTMLInputElement).files;
    if (!files) return;
    const urls: string[] = [];
    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) { toast({ title: "Arquivo muito grande", description: `${file.name} excede 10MB`, variant: "destructive" }); return; }
      urls.push(URL.createObjectURL(file));
    });
    onFiles(urls);
  };
  input.click();
};

const calcGestationalAge = (dum: string): string => {
  if (!dum) return "—";
  const dumDate = new Date(dum);
  const today = new Date();
  const diffMs = today.getTime() - dumDate.getTime();
  const weeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  const days = Math.floor((diffMs % (7 * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000));
  if (weeks < 0) return "—";
  return `${weeks}s ${days}d`;
};

const calcDPP = (dum: string): string => {
  if (!dum) return "";
  const dumDate = new Date(dum);
  dumDate.setDate(dumDate.getDate() + 280);
  return dumDate.toISOString().split("T")[0];
};

const RegistroClinicoTab = () => {
  const { user, users } = useAuth();
  const { records, addRecord, updateRecord, deleteRecord, addPrenatalConsultation, addGestationalExam } = useClinicalRecords();
  const professionals = users.filter((u) => u.role === "admin" || u.role === "afiliada");

  const [view, setView] = useState<View>("list");
  const [search, setSearch] = useState("");
  const [filterProfessionalId, setFilterProfessionalId] = useState<string>(
    user?.role === "admin" ? user.id : "all"
  );
  const [selectedRecord, setSelectedRecord] = useState<ClinicalRecord | null>(null);
  const [formData, setFormData] = useState<Omit<ClinicalRecord, "id"> | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [consultDialogOpen, setConsultDialogOpen] = useState(false);
  const [consultForm, setConsultForm] = useState<Omit<PrenatalConsultation, "id">>({
    date: new Date().toISOString().split("T")[0], gestationalAge: "", weight: "", bloodPressure: "",
    uterineHeight: "", fetalHeartRate: "", edema: "Ausente", fetalPresentation: "",
    observations: "", conduct: "", professional: "", nextAppointment: "",
  });

  const [examDialogOpen, setExamDialogOpen] = useState(false);
  const [examForm, setExamForm] = useState<Omit<GestationalExam, "id">>({
    date: new Date().toISOString().split("T")[0], type: "", result: "", observations: "", fileUrl: "",
  });

  const filteredRecords = useMemo(() => {
    let result = records;
    // Filter by professional
    if (filterProfessionalId !== "all") {
      result = result.filter((r) =>
        r.assignedProfessionals?.some((p) => p.id === filterProfessionalId)
      );
    }
    // Filter by search
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((r) =>
        r.patientName.toLowerCase().includes(s) || r.prontuarioNumber.toLowerCase().includes(s)
      );
    }
    return result;
  }, [records, filterProfessionalId, search]);

  const getNextRecordNumber = () => {
    const nums = records.map((r) => {
      const match = r.prontuarioNumber.match(/(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    });
    return Math.max(0, ...nums) + 1;
  };

  const openNewRecord = () => {
    const defaultProfessionals: AssignedProfessional[] = user && (user.role === "admin" || user.role === "afiliada")
      ? [{ id: user.id, name: user.name }]
      : [];
    setFormData({ ...createEmptyRecord("", "", getNextRecordNumber(), defaultProfessionals) });
    setEditingId(null);
    setView("form");
  };

  const openEditRecord = (record: ClinicalRecord) => {
    const { id, ...rest } = record;
    setFormData(rest);
    setEditingId(id);
    setView("form");
  };

  const handleSave = () => {
    if (!formData || !formData.fullName) {
      toast({ title: "Preencha o nome completo da gestante", variant: "destructive" });
      return;
    }
    if (!formData.assignedProfessionals || formData.assignedProfessionals.length === 0) {
      toast({ title: "Selecione ao menos um profissional responsável", variant: "destructive" });
      return;
    }
    if (!formData.patientId) {
      formData.patientId = `new-${Date.now()}`;
      formData.patientName = formData.fullName;
    }
    if (formData.gestationalCard.dum && !formData.gestationalCard.dpp) {
      formData.gestationalCard.dpp = calcDPP(formData.gestationalCard.dum);
    }
    if (editingId) {
      updateRecord(editingId, formData);
      toast({ title: "Registro atualizado!" });
    } else {
      addRecord(formData);
      toast({ title: "Registro gestacional criado!" });
    }
    setView("list");
  };

  const handleDelete = (id: string) => { deleteRecord(id); toast({ title: "Registro removido" }); };

  const toggleProfessional = (profId: string, profName: string) => {
    if (!formData) return;
    const current = formData.assignedProfessionals || [];
    const exists = current.some((p) => p.id === profId);
    const updated = exists
      ? current.filter((p) => p.id !== profId)
      : [...current, { id: profId, name: profName }];
    setFormData({ ...formData, assignedProfessionals: updated });
  };

  const handleAddConsultation = () => {
    if (!selectedRecord || !consultForm.date) return;
    addPrenatalConsultation(selectedRecord.id, consultForm);
    setSelectedRecord((prev) => prev ? { ...prev, prenatalConsultations: [...prev.prenatalConsultations, { ...consultForm, id: `pc${Date.now()}` }] } : prev);
    setConsultDialogOpen(false);
    setConsultForm({ date: new Date().toISOString().split("T")[0], gestationalAge: "", weight: "", bloodPressure: "", uterineHeight: "", fetalHeartRate: "", edema: "Ausente", fetalPresentation: "", observations: "", conduct: "", professional: "", nextAppointment: "" });
    toast({ title: "Consulta pré-natal registrada!" });
  };

  const handleAddExam = () => {
    if (!selectedRecord || !examForm.type) return;
    addGestationalExam(selectedRecord.id, examForm);
    setSelectedRecord((prev) => prev ? { ...prev, gestationalExams: [...prev.gestationalExams, { ...examForm, id: `ge${Date.now()}` }] } : prev);
    setExamDialogOpen(false);
    setExamForm({ date: new Date().toISOString().split("T")[0], type: "", result: "", observations: "", fileUrl: "" });
    toast({ title: "Exame registrado!" });
  };

  const updateForm = (field: string, value: any) => {
    setFormData((prev) => prev ? { ...prev, [field]: value } : prev);
  };

  const updateGestCard = (field: string, value: any) => {
    setFormData((prev) => prev ? { ...prev, gestationalCard: { ...prev.gestationalCard, [field]: value } } : prev);
  };

  // ===== LIST VIEW =====
  if (view === "list") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0 flex-wrap">
            <Input placeholder="Buscar gestante ou registro..." value={search} onChange={(e) => setSearch(e.target.value)} className="rounded-xl max-w-sm" />
            <Select value={filterProfessionalId} onValueChange={setFilterProfessionalId}>
              <SelectTrigger className="rounded-xl w-[220px]">
                <SelectValue placeholder="Filtrar por profissional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os profissionais</SelectItem>
                {professionals.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={openNewRecord} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full font-heading shadow-md shadow-secondary/20">
            Nova Ficha Gestacional
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { value: filteredRecords.length, label: "Total de Fichas" },
            { value: filteredRecords.filter((r) => r.status === "ativo").length, label: "Ativas" },
            { value: filteredRecords.reduce((sum, r) => sum + r.prenatalConsultations.length, 0), label: "Consultas Registradas" },
            { value: filteredRecords.reduce((sum, r) => sum + r.gestationalExams.length, 0), label: "Exames" },
          ].map((s) => (
            <Card key={s.label} className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-heading font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-3">
          {filteredRecords.length === 0 ? (
            <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
              <CardContent className="p-8 text-center">
                <p className="text-sm text-muted-foreground font-heading">Nenhum registro encontrado</p>
              </CardContent>
            </Card>
          ) : filteredRecords.map((record) => (
            <Card key={record.id} className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5 hover:shadow-xl transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {record.patientPhoto ? (
                      <img src={record.patientPhoto} alt="" className="w-10 h-10 rounded-full object-cover border border-border shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-border shrink-0">
                        <span className="text-xs text-muted-foreground font-heading">{record.patientName.charAt(0)}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-heading font-bold text-foreground text-sm">{record.patientName}</h3>
                        <Badge variant="outline" className="text-[10px] font-heading">Gestacional</Badge>
                        <Badge variant={record.status === "ativo" ? "default" : "secondary"} className="text-[10px] font-heading">
                          {record.status === "ativo" ? "Ativo" : "Arquivado"}
                        </Badge>
                        {record.gestationalCard.riskClassification === "alto_risco" && (
                          <Badge variant="destructive" className="text-[10px] font-heading">Alto Risco</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{record.prontuarioNumber}</p>
                      <div className="flex gap-3 text-xs text-muted-foreground flex-wrap">
                        {record.gestationalCard.dum && (
                          <span>IG: {calcGestationalAge(record.gestationalCard.dum)}</span>
                        )}
                        {record.gestationalCard.dpp && (
                          <span>DPP: {format(new Date(record.gestationalCard.dpp), "dd/MM/yyyy")}</span>
                        )}
                        <span>{record.prenatalConsultations.length} consulta(s)</span>
                      </div>
                      {record.assignedProfessionals && record.assignedProfessionals.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {record.assignedProfessionals.map((p) => (
                            <Badge key={p.id} variant="outline" className="text-[10px] font-heading bg-primary/5">
                              {p.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost" className="text-xs font-heading" onClick={() => { setSelectedRecord(record); setView("detail"); }}>Ver</Button>
                    <Button size="sm" variant="ghost" className="text-xs font-heading" onClick={() => openEditRecord(record)}>Editar</Button>
                    <Button size="sm" variant="ghost" className="text-xs font-heading hover:text-destructive" onClick={() => handleDelete(record.id)}>Excluir</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ===== FORM VIEW =====
  if (view === "form" && formData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button onClick={() => setView("list")} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full font-heading text-sm">← Voltar</Button>
          <h2 className="font-heading font-bold text-foreground">{editingId ? "Editar Ficha Gestacional" : "Nova Ficha Gestacional"}</h2>
          <Button onClick={handleSave} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full font-heading shadow-md shadow-secondary/20">Salvar</Button>
        </div>

        {/* Professionals */}
        <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-heading">Profissionais Responsáveis *</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">Selecione os médicos/enfermeiros responsáveis por esta gestante:</p>
            <div className="flex flex-wrap gap-2">
              {professionals.map((p) => {
                const isSelected = formData.assignedProfessionals?.some((ap) => ap.id === p.id);
                return (
                  <Button
                    key={p.id}
                    type="button"
                    size="sm"
                    variant={isSelected ? "default" : "outline"}
                    className={`rounded-full font-heading text-xs ${isSelected ? "bg-secondary text-secondary-foreground" : ""}`}
                    onClick={() => toggleProfessional(p.id, p.name)}
                  >
                    {p.name} ({p.role === "admin" ? "Admin" : "Afiliada"})
                  </Button>
                );
              })}
            </div>
            {formData.assignedProfessionals && formData.assignedProfessionals.length > 0 && (
              <div className="flex gap-1 mt-3 flex-wrap">
                {formData.assignedProfessionals.map((p) => (
                  <Badge key={p.id} className="font-heading text-xs">{p.name}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Identification */}
        <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-heading">Identificação da Gestante</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="relative">
                {formData.patientPhoto ? (
                  <img src={formData.patientPhoto} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-primary/20" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border">
                    <span className="text-xs text-muted-foreground font-heading">Foto</span>
                  </div>
                )}
              </div>
              <Button type="button" size="sm" variant="outline" className="rounded-xl text-xs font-heading" onClick={() => handleFileUpload("image/*", (urls) => { if (urls[0]) updateForm("patientPhoto", urls[0]); })}>
                {formData.patientPhoto ? "Trocar" : "Foto"}
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <div className="space-y-1 col-span-2"><Label className="text-xs font-heading">Nome Completo *</Label><Input value={formData.fullName} onChange={(e) => { updateForm("fullName", e.target.value); updateForm("patientName", e.target.value); }} className="rounded-xl" /></div>
              <div className="space-y-1"><Label className="text-xs font-heading">Nº Registro</Label><Input value={formData.prontuarioNumber} readOnly className="rounded-xl bg-muted" /></div>
              <div className="space-y-1"><Label className="text-xs font-heading">Nascimento</Label><Input type="date" value={formData.birthDate} onChange={(e) => updateForm("birthDate", e.target.value)} className="rounded-xl" /></div>
              <div className="space-y-1"><Label className="text-xs font-heading">Telefone</Label><Input value={formData.phone} onChange={(e) => updateForm("phone", e.target.value)} className="rounded-xl" /></div>
              <div className="space-y-1"><Label className="text-xs font-heading">Estado Civil</Label><Input value={formData.maritalStatus} onChange={(e) => updateForm("maritalStatus", e.target.value)} className="rounded-xl" /></div>
              <div className="space-y-1"><Label className="text-xs font-heading">Profissão</Label><Input value={formData.profession} onChange={(e) => updateForm("profession", e.target.value)} className="rounded-xl" /></div>
              <div className="space-y-1"><Label className="text-xs font-heading">Contato Emergência</Label><Input value={formData.emergencyContact} onChange={(e) => updateForm("emergencyContact", e.target.value)} className="rounded-xl" /></div>
              <div className="space-y-1 col-span-2 md:col-span-4"><Label className="text-xs font-heading">Endereço</Label><Input value={formData.address} onChange={(e) => updateForm("address", e.target.value)} className="rounded-xl" /></div>
              <div className="col-span-2 md:col-span-4 flex items-center gap-3">
                <Checkbox checked={formData.consentSigned} onCheckedChange={(v) => updateForm("consentSigned", !!v)} />
                <Label className="text-xs font-heading font-semibold">Termo de consentimento assinado</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gestational Card */}
        <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-heading">Cartão da Gestante</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <div className="space-y-1">
                <Label className="text-xs font-heading">Tipo Sanguíneo</Label>
                <Select value={formData.gestationalCard.bloodType} onValueChange={(v) => updateGestCard("bloodType", v)}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {["A", "B", "AB", "O"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-heading">Rh</Label>
                <Select value={formData.gestationalCard.rh} onValueChange={(v) => updateGestCard("rh", v)}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+">Positivo (+)</SelectItem>
                    <SelectItem value="-">Negativo (-)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs font-heading">DUM</Label><Input type="date" value={formData.gestationalCard.dum} onChange={(e) => { updateGestCard("dum", e.target.value); updateGestCard("dpp", calcDPP(e.target.value)); }} className="rounded-xl" /></div>
              <div className="space-y-1"><Label className="text-xs font-heading">DPP (auto)</Label><Input value={formData.gestationalCard.dpp} readOnly className="rounded-xl bg-muted" /></div>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2.5">
              <div className="space-y-1"><Label className="text-xs font-heading">Gestações (G)</Label><Input value={formData.gestationalCard.gravida} onChange={(e) => updateGestCard("gravida", e.target.value)} className="rounded-xl" /></div>
              <div className="space-y-1"><Label className="text-xs font-heading">Partos (P)</Label><Input value={formData.gestationalCard.para} onChange={(e) => updateGestCard("para", e.target.value)} className="rounded-xl" /></div>
              <div className="space-y-1"><Label className="text-xs font-heading">Abortos (A)</Label><Input value={formData.gestationalCard.abortions} onChange={(e) => updateGestCard("abortions", e.target.value)} className="rounded-xl" /></div>
              <div className="space-y-1"><Label className="text-xs font-heading">Peso Pré-gest.</Label><Input value={formData.gestationalCard.preGestationalWeight} onChange={(e) => updateGestCard("preGestationalWeight", e.target.value)} className="rounded-xl" placeholder="kg" /></div>
              <div className="space-y-1"><Label className="text-xs font-heading">Altura</Label><Input value={formData.gestationalCard.height} onChange={(e) => updateGestCard("height", e.target.value)} className="rounded-xl" placeholder="m" /></div>
              <div className="space-y-1"><Label className="text-xs font-heading">IMC Pré-gest.</Label><Input value={formData.gestationalCard.preGestationalBmi} onChange={(e) => updateGestCard("preGestationalBmi", e.target.value)} className="rounded-xl" /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div className="space-y-1"><Label className="text-xs font-heading">Alergias</Label><Input value={formData.gestationalCard.allergies} onChange={(e) => updateGestCard("allergies", e.target.value)} className="rounded-xl" /></div>
              <div className="space-y-1"><Label className="text-xs font-heading">Medicamentos em uso</Label><Input value={formData.gestationalCard.medications} onChange={(e) => updateGestCard("medications", e.target.value)} className="rounded-xl" /></div>
              <div className="space-y-1"><Label className="text-xs font-heading">Condições pré-existentes</Label><Input value={formData.gestationalCard.preExistingConditions} onChange={(e) => updateGestCard("preExistingConditions", e.target.value)} className="rounded-xl" /></div>
              <div className="space-y-1"><Label className="text-xs font-heading">Cirurgias anteriores</Label><Input value={formData.gestationalCard.previousSurgeries} onChange={(e) => updateGestCard("previousSurgeries", e.target.value)} className="rounded-xl" /></div>
              <div className="space-y-1"><Label className="text-xs font-heading">Histórico familiar</Label><Input value={formData.gestationalCard.familyHistory} onChange={(e) => updateGestCard("familyHistory", e.target.value)} className="rounded-xl" /></div>
              <div className="space-y-1">
                <Label className="text-xs font-heading">Classificação de Risco</Label>
                <Select value={formData.gestationalCard.riskClassification} onValueChange={(v: any) => updateGestCard("riskClassification", v)}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="habitual">Risco Habitual</SelectItem>
                    <SelectItem value="alto_risco">Alto Risco</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Separator />
            <p className="text-xs font-heading font-semibold text-foreground">Plano de Parto e Apoio</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div className="space-y-1"><Label className="text-xs font-heading">Acompanhante</Label><Input value={formData.gestationalCard.companion} onChange={(e) => updateGestCard("companion", e.target.value)} className="rounded-xl" /></div>
              <div className="space-y-1"><Label className="text-xs font-heading">Tel. Acompanhante</Label><Input value={formData.gestationalCard.companionPhone} onChange={(e) => updateGestCard("companionPhone", e.target.value)} className="rounded-xl" /></div>
              <div className="space-y-1"><Label className="text-xs font-heading">Pediatra</Label><Input value={formData.gestationalCard.pediatrician} onChange={(e) => updateGestCard("pediatrician", e.target.value)} className="rounded-xl" /></div>
              <div className="space-y-1"><Label className="text-xs font-heading">Hospital/Maternidade</Label><Input value={formData.gestationalCard.hospital} onChange={(e) => updateGestCard("hospital", e.target.value)} className="rounded-xl" /></div>
              <div className="space-y-1 col-span-1 md:col-span-2"><Label className="text-xs font-heading">Plano de Parto</Label><Textarea value={formData.gestationalCard.birthPlan} onChange={(e) => updateGestCard("birthPlan", e.target.value)} className="rounded-xl min-h-[60px]" placeholder="Descreva as preferências para o parto..." /></div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 pb-6">
          <Button variant="outline" onClick={() => setView("list")} className="flex-1 rounded-full font-heading">Cancelar</Button>
          <Button onClick={handleSave} className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full font-heading shadow-md shadow-secondary/20">
            {editingId ? "Salvar Alterações" : "Criar Registro"}
          </Button>
        </div>
      </div>
    );
  }

  // ===== DETAIL VIEW =====
  if (view === "detail" && selectedRecord) {
    const r = selectedRecord;
    const gc = r.gestationalCard;
    const igAtual = calcGestationalAge(gc.dum);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button onClick={() => setView("list")} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full font-heading text-sm">← Voltar</Button>
          <Button variant="outline" onClick={() => openEditRecord(r)} className="rounded-full font-heading text-sm">Editar</Button>
        </div>

        {/* Header Card */}
        <Card className="bg-gradient-to-r from-secondary/10 to-primary/10 backdrop-blur-xl border-white/50 shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {r.patientPhoto ? (
                  <img src={r.patientPhoto} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-primary/20 shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border shrink-0">
                    <span className="text-lg text-muted-foreground font-heading font-bold">{r.fullName.charAt(0)}</span>
                  </div>
                )}
                <div>
                  <h2 className="font-heading font-bold text-xl text-foreground">{r.fullName}</h2>
                  <p className="text-sm text-muted-foreground">{r.prontuarioNumber}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <Badge variant="outline" className="font-heading text-xs">Gestacional</Badge>
                    <Badge variant={r.status === "ativo" ? "default" : "secondary"} className="font-heading text-xs">{r.status}</Badge>
                    {gc.riskClassification === "alto_risco" && <Badge variant="destructive" className="font-heading text-xs">Alto Risco</Badge>}
                    {gc.bloodType && <Badge variant="outline" className="font-heading text-xs">{gc.bloodType}{gc.rh}</Badge>}
                  </div>
                  {r.assignedProfessionals && r.assignedProfessionals.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      <span className="text-[10px] text-muted-foreground mr-1">Profissionais:</span>
                      {r.assignedProfessionals.map((p) => (
                        <Badge key={p.id} variant="outline" className="text-[10px] font-heading bg-primary/5">{p.name}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right space-y-1">
                {gc.dum && (
                  <div className="bg-secondary/20 rounded-xl px-4 py-2 text-center">
                    <p className="text-[10px] text-muted-foreground font-heading uppercase">Idade Gestacional</p>
                    <p className="text-lg font-heading font-bold text-secondary">{igAtual}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="cartao" className="w-full">
          <TabsList className="w-full grid grid-cols-4 bg-white/40 backdrop-blur-xl rounded-xl">
            <TabsTrigger value="cartao" className="rounded-lg font-heading text-xs">Cartão</TabsTrigger>
            <TabsTrigger value="consultas" className="rounded-lg font-heading text-xs">Consultas ({r.prenatalConsultations.length})</TabsTrigger>
            <TabsTrigger value="exames" className="rounded-lg font-heading text-xs">Exames ({r.gestationalExams.length})</TabsTrigger>
            <TabsTrigger value="dados" className="rounded-lg font-heading text-xs">Dados Pessoais</TabsTrigger>
          </TabsList>

          {/* CARTÃO DA GESTANTE */}
          <TabsContent value="cartao" className="space-y-4 mt-4">
            <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-heading">Cartão Digital da Gestante</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Tipo Sanguíneo", value: gc.bloodType ? `${gc.bloodType} ${gc.rh}` : "—" },
                    { label: "G / P / A", value: gc.gravida ? `G${gc.gravida}P${gc.para}A${gc.abortions}` : "—" },
                    { label: "DUM", value: gc.dum ? format(new Date(gc.dum), "dd/MM/yyyy") : "—" },
                    { label: "DPP", value: gc.dpp ? format(new Date(gc.dpp), "dd/MM/yyyy") : "—" },
                    { label: "Peso Pré-gestacional", value: gc.preGestationalWeight || "—" },
                    { label: "IMC Pré-gestacional", value: gc.preGestationalBmi || "—" },
                    { label: "Classificação", value: gc.riskClassification === "habitual" ? "Risco Habitual" : "Alto Risco" },
                    { label: "IG Atual", value: igAtual },
                  ].map((item) => (
                    <div key={item.label} className="bg-white/30 backdrop-blur-lg rounded-xl p-3 text-center">
                      <p className="text-[10px] text-muted-foreground font-heading uppercase">{item.label}</p>
                      <p className="text-sm font-heading font-bold text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>

                <Separator />
                <p className="text-xs font-heading font-semibold text-foreground">Saúde e Histórico</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { label: "Alergias", value: gc.allergies },
                    { label: "Medicamentos", value: gc.medications },
                    { label: "Condições pré-existentes", value: gc.preExistingConditions },
                    { label: "Cirurgias anteriores", value: gc.previousSurgeries },
                    { label: "Histórico familiar", value: gc.familyHistory },
                  ].filter(v => v.value).map((item) => (
                    <div key={item.label} className="bg-white/30 backdrop-blur-lg rounded-xl p-3">
                      <p className="text-[10px] text-muted-foreground font-heading uppercase">{item.label}</p>
                      <p className="text-sm text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>

                <Separator />
                <p className="text-xs font-heading font-semibold text-foreground">Plano de Parto e Apoio</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Acompanhante", value: gc.companion },
                    { label: "Tel. Acompanhante", value: gc.companionPhone },
                    { label: "Pediatra", value: gc.pediatrician },
                    { label: "Hospital", value: gc.hospital },
                  ].filter(v => v.value).map((item) => (
                    <div key={item.label} className="bg-white/30 backdrop-blur-lg rounded-xl p-3">
                      <p className="text-[10px] text-muted-foreground font-heading uppercase">{item.label}</p>
                      <p className="text-sm text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>
                {gc.birthPlan && (
                  <div className="bg-white/30 backdrop-blur-lg rounded-xl p-3">
                    <p className="text-[10px] text-muted-foreground font-heading uppercase">Plano de Parto</p>
                    <p className="text-sm text-foreground">{gc.birthPlan}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* CONSULTAS PRÉ-NATAIS */}
          <TabsContent value="consultas" className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setConsultDialogOpen(true)} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full font-heading text-sm">
                Nova Consulta
              </Button>
            </div>
            {r.prenatalConsultations.length === 0 ? (
              <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg">
                <CardContent className="p-8 text-center">
                  <p className="text-sm text-muted-foreground font-heading">Nenhuma consulta pré-natal registrada</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {r.prenatalConsultations.map((c, idx) => (
                  <Card key={c.id} className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-heading font-bold text-sm text-foreground">Consulta #{idx + 1}</h4>
                          <p className="text-xs text-muted-foreground">{format(new Date(c.date), "dd/MM/yyyy", { locale: ptBR })} • {c.gestationalAge}</p>
                        </div>
                        {c.professional && <span className="text-xs text-muted-foreground font-heading">{c.professional}</span>}
                      </div>
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        {[
                          { label: "Peso", value: c.weight },
                          { label: "PA", value: c.bloodPressure },
                          { label: "AU", value: c.uterineHeight },
                          { label: "BCF", value: c.fetalHeartRate },
                          { label: "Edema", value: c.edema },
                          { label: "Apresentação", value: c.fetalPresentation },
                        ].filter(v => v.value).map((item) => (
                          <div key={item.label} className="bg-white/30 backdrop-blur-lg rounded-lg p-2 text-center">
                            <p className="text-[10px] text-muted-foreground font-heading">{item.label}</p>
                            <p className="text-xs font-heading font-semibold text-foreground">{item.value}</p>
                          </div>
                        ))}
                      </div>
                      {c.observations && (
                        <div className="mt-2 text-xs text-foreground"><span className="text-muted-foreground">Observações:</span> {c.observations}</div>
                      )}
                      {c.conduct && (
                        <div className="mt-1 text-xs text-primary"><span className="text-muted-foreground">Conduta:</span> {c.conduct}</div>
                      )}
                      {c.nextAppointment && (
                        <div className="mt-1 text-xs text-muted-foreground">Próxima consulta: {format(new Date(c.nextAppointment), "dd/MM/yyyy")}</div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* EXAMES */}
          <TabsContent value="exames" className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setExamDialogOpen(true)} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full font-heading text-sm">
                Novo Exame
              </Button>
            </div>
            {r.gestationalExams.length === 0 ? (
              <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg">
                <CardContent className="p-8 text-center">
                  <p className="text-sm text-muted-foreground font-heading">Nenhum exame registrado</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {r.gestationalExams.map((exam) => (
                  <Card key={exam.id} className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-heading font-bold text-sm text-foreground">{exam.type}</h4>
                        <span className="text-xs text-muted-foreground">{format(new Date(exam.date), "dd/MM/yyyy")}</span>
                      </div>
                      <p className="text-xs text-foreground"><span className="text-muted-foreground">Resultado:</span> {exam.result}</p>
                      {exam.observations && (
                        <p className="text-xs text-muted-foreground mt-1">{exam.observations}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* DADOS PESSOAIS */}
          <TabsContent value="dados" className="space-y-4 mt-4">
            <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Nascimento", value: r.birthDate ? format(new Date(r.birthDate), "dd/MM/yyyy") : "—" },
                    { label: "Telefone", value: r.phone || "—" },
                    { label: "Estado Civil", value: r.maritalStatus || "—" },
                    { label: "Profissão", value: r.profession || "—" },
                    { label: "Endereço", value: r.address || "—" },
                    { label: "Emergência", value: r.emergencyContact || "—" },
                    { label: "Consentimento", value: r.consentSigned ? "Assinado" : "Pendente" },
                  ].map((item) => (
                    <div key={item.label} className="bg-white/30 backdrop-blur-lg rounded-xl p-3">
                      <p className="text-[10px] text-muted-foreground font-heading uppercase">{item.label}</p>
                      <p className="text-sm font-heading font-semibold text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Consultation Dialog */}
        <Dialog open={consultDialogOpen} onOpenChange={setConsultDialogOpen}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-heading">Registrar Consulta Pré-natal</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-xs font-heading">Data *</Label><Input type="date" value={consultForm.date} onChange={(e) => setConsultForm({ ...consultForm, date: e.target.value })} className="rounded-xl" /></div>
                <div className="space-y-1.5"><Label className="text-xs font-heading">Idade Gestacional</Label><Input value={consultForm.gestationalAge} onChange={(e) => setConsultForm({ ...consultForm, gestationalAge: e.target.value })} className="rounded-xl" placeholder="Ex: 20 semanas" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5"><Label className="text-xs font-heading">Peso</Label><Input value={consultForm.weight} onChange={(e) => setConsultForm({ ...consultForm, weight: e.target.value })} className="rounded-xl" placeholder="kg" /></div>
                <div className="space-y-1.5"><Label className="text-xs font-heading">Pressão Arterial</Label><Input value={consultForm.bloodPressure} onChange={(e) => setConsultForm({ ...consultForm, bloodPressure: e.target.value })} className="rounded-xl" placeholder="mmHg" /></div>
                <div className="space-y-1.5"><Label className="text-xs font-heading">Altura Uterina</Label><Input value={consultForm.uterineHeight} onChange={(e) => setConsultForm({ ...consultForm, uterineHeight: e.target.value })} className="rounded-xl" placeholder="cm" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5"><Label className="text-xs font-heading">BCF (batimentos)</Label><Input value={consultForm.fetalHeartRate} onChange={(e) => setConsultForm({ ...consultForm, fetalHeartRate: e.target.value })} className="rounded-xl" placeholder="bpm" /></div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-heading">Edema</Label>
                  <Select value={consultForm.edema} onValueChange={(v) => setConsultForm({ ...consultForm, edema: v })}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ausente">Ausente</SelectItem>
                      <SelectItem value="+">+</SelectItem>
                      <SelectItem value="++">++</SelectItem>
                      <SelectItem value="+++">+++</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label className="text-xs font-heading">Apresentação Fetal</Label><Input value={consultForm.fetalPresentation} onChange={(e) => setConsultForm({ ...consultForm, fetalPresentation: e.target.value })} className="rounded-xl" placeholder="Cefálica, Pélvica..." /></div>
              </div>
              <div className="space-y-1.5"><Label className="text-xs font-heading">Observações</Label><Textarea value={consultForm.observations} onChange={(e) => setConsultForm({ ...consultForm, observations: e.target.value })} className="rounded-xl min-h-[50px]" /></div>
              <div className="space-y-1.5"><Label className="text-xs font-heading">Conduta</Label><Textarea value={consultForm.conduct} onChange={(e) => setConsultForm({ ...consultForm, conduct: e.target.value })} className="rounded-xl min-h-[50px]" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-xs font-heading">Profissional</Label><Input value={consultForm.professional} onChange={(e) => setConsultForm({ ...consultForm, professional: e.target.value })} className="rounded-xl" /></div>
                <div className="space-y-1.5"><Label className="text-xs font-heading">Próxima Consulta</Label><Input type="date" value={consultForm.nextAppointment} onChange={(e) => setConsultForm({ ...consultForm, nextAppointment: e.target.value })} className="rounded-xl" /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setConsultDialogOpen(false)} className="flex-1 rounded-full font-heading">Cancelar</Button>
                <Button onClick={handleAddConsultation} className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full font-heading">Registrar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Exam Dialog */}
        <Dialog open={examDialogOpen} onOpenChange={setExamDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle className="font-heading">Registrar Exame</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-xs font-heading">Data</Label><Input type="date" value={examForm.date} onChange={(e) => setExamForm({ ...examForm, date: e.target.value })} className="rounded-xl" /></div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-heading">Tipo de Exame *</Label>
                  <Select value={examForm.type} onValueChange={(v) => setExamForm({ ...examForm, type: v })}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {["Ultrassom 1º Trimestre", "Ultrassom Morfológico", "Ultrassom 3º Trimestre", "Hemograma Completo", "Tipagem Sanguínea", "Glicemia", "TOTG", "Urina Tipo I", "Urocultura", "Toxoplasmose", "Rubéola", "HIV", "VDRL", "Hepatite B", "Hepatite C", "TSH", "Coombs Indireto", "Estreptococo B", "Outro"].map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5"><Label className="text-xs font-heading">Resultado</Label><Textarea value={examForm.result} onChange={(e) => setExamForm({ ...examForm, result: e.target.value })} className="rounded-xl min-h-[60px]" /></div>
              <div className="space-y-1.5"><Label className="text-xs font-heading">Observações</Label><Input value={examForm.observations} onChange={(e) => setExamForm({ ...examForm, observations: e.target.value })} className="rounded-xl" /></div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setExamDialogOpen(false)} className="flex-1 rounded-full font-heading">Cancelar</Button>
                <Button onClick={handleAddExam} className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full font-heading">Registrar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return null;
};

export default RegistroClinicoTab;
