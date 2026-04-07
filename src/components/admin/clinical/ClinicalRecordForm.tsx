import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { createEmptyRecord, type ClinicalRecord, type AssignedProfessional } from "@/contexts/ClinicalRecordContext";
import { calcGestationalAge, calcDPP, calcIMC, formatCPF, lookupCPF, handleFileUpload } from "./constants";

interface ClinicalRecordFormProps {
  initialData?: ClinicalRecord;
  nextNumber: number;
  onSave: (data: Omit<ClinicalRecord, "id">, editingId?: string) => void;
  onCancel: () => void;
}

const ClinicalRecordForm = ({ initialData, nextNumber, onSave, onCancel }: ClinicalRecordFormProps) => {
  const { user, users } = useAuth();
  const professionals = users.filter(u => u.role === "admin" || u.role === "super_admin");

  const defaultProfessionals: AssignedProfessional[] = user && user.role === "admin" ? [{ id: user.id, name: user.name }] : [];

  const [formData, setFormData] = useState<Omit<ClinicalRecord, "id">>(() => {
    if (initialData) {
      const { id, ...rest } = initialData;
      return rest;
    }
    return createEmptyRecord("", "", nextNumber, defaultProfessionals);
  });

  const [cpfLocked, setCpfLocked] = useState(!!initialData?.cpf);
  const [cpfLoading, setCpfLoading] = useState(false);
  const [formSpecialtyFilter, setFormSpecialtyFilter] = useState<string>("all");

  const filteredProfessionals = useMemo(() => {
    if (formSpecialtyFilter === "all") return professionals;
    return professionals.filter(p => p.specialty === formSpecialtyFilter);
  }, [professionals, formSpecialtyFilter]);

  useEffect(() => {
    if (filteredProfessionals.length === 1) {
      const p = filteredProfessionals[0];
      if (!formData.assignedProfessionals?.some(ap => ap.id === p.id)) {
        setFormData(prev => ({ ...prev, assignedProfessionals: [{ id: p.id, name: p.name }] }));
      }
    }
  }, [filteredProfessionals]);

  const updateForm = (field: string, value: any) => setFormData(prev => ({ ...prev, [field]: value }));

  const updateGestCard = (field: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, gestationalCard: { ...prev.gestationalCard, [field]: value } };
      if (field === "preGestationalWeight" || field === "height") {
        const w = field === "preGestationalWeight" ? value : updated.gestationalCard.preGestationalWeight;
        const h = field === "height" ? value : updated.gestationalCard.height;
        const imc = calcIMC(w, h);
        if (imc) updated.gestationalCard.preGestationalBmi = imc;
      }
      if (field === "dum" && value) updated.gestationalCard.dpp = calcDPP(value);
      return updated;
    });
  };

  const handleCPFChange = useCallback(async (value: string) => {
    const formatted = formatCPF(value);
    updateForm("cpf", formatted);
    const clean = formatted.replace(/\D/g, "");
    if (clean.length === 11 && !cpfLocked) {
      setCpfLoading(true);
      toast({ title: "Consultando CPF...", description: "Buscando dados da gestante" });
      const data = await lookupCPF(formatted);
      setCpfLoading(false);
      if (data && data.name) {
        setFormData(prev => ({ ...prev, cpf: formatted, fullName: data.name, patientName: data.name, birthDate: data.birthDate, address: data.address }));
        setCpfLocked(true);
        if (data.source === "api_real") {
          toast({ title: "✅ Dados da Receita Federal encontrados!", description: data.name });
        } else {
          toast({ title: "CPF válido — dados sugeridos", description: "Confira e corrija os dados se necessário." });
        }
      } else if (data) {
        setCpfLocked(true);
        toast({ title: "CPF válido", description: "Preencha os dados manualmente." });
      } else {
        toast({ title: "CPF inválido", description: "Verifique os dígitos informados.", variant: "destructive" });
      }
    }
  }, [cpfLocked]);

  const toggleProfessional = (profId: string, profName: string) => {
    const current = formData.assignedProfessionals || [];
    const exists = current.some(p => p.id === profId);
    setFormData({ ...formData, assignedProfessionals: exists ? current.filter(p => p.id !== profId) : [...current, { id: profId, name: profName }] });
  };

  const handleSave = () => {
    if (!formData.fullName) { toast({ title: "Preencha o nome completo da gestante", variant: "destructive" }); return; }
    if (!formData.assignedProfessionals?.length) { toast({ title: "Selecione ao menos um profissional", variant: "destructive" }); return; }
    if (!formData.patientId) { formData.patientId = `new-${Date.now()}`; formData.patientName = formData.fullName; }
    if (formData.gestationalCard.dum && !formData.gestationalCard.dpp) formData.gestationalCard.dpp = calcDPP(formData.gestationalCard.dum);
    const imc = calcIMC(formData.gestationalCard.preGestationalWeight, formData.gestationalCard.height);
    if (imc) formData.gestationalCard.preGestationalBmi = imc;
    onSave(formData, initialData?.id);
  };

  const specialtyLabel = (s: string) => s === "medico_obstetra" ? "Médico(a) Obstetra" : s === "enfermeiro_obstetra" ? "Enfermeiro(a) Obstetra" : "Profissional";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Button onClick={onCancel} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full font-heading text-sm">← Voltar</Button>
        <h2 className="font-heading font-bold text-foreground">{initialData ? "Editar Ficha" : "Nova Ficha Gestacional"}</h2>
        <Button onClick={handleSave} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full font-heading text-sm">Salvar</Button>
      </div>

      {/* CPF + Profissionais lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
          <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-xs font-heading">Identificação por CPF</CardTitle></CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="flex items-end gap-2">
              <div className="space-y-1 flex-1">
                <Label className="text-[10px] font-heading">CPF *</Label>
                <Input value={formData.cpf || ""} onChange={e => handleCPFChange(e.target.value)} className="rounded-xl h-9 text-sm" placeholder="000.000.000-00" disabled={(cpfLocked && !!initialData) || cpfLoading} />
                {cpfLoading && <span className="text-[10px] text-muted-foreground animate-pulse">Consultando...</span>}
              </div>
              {cpfLocked && <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => setCpfLocked(false)}>Editar</Button>}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
          <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-xs font-heading">Profissionais Responsáveis *</CardTitle></CardHeader>
          <CardContent className="px-4 pb-3 space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-[10px] font-heading whitespace-nowrap">Categoria:</Label>
              <Select value={formSpecialtyFilter} onValueChange={setFormSpecialtyFilter}>
                <SelectTrigger className="rounded-xl h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="medico_obstetra">Médico(a) Obstetra</SelectItem>
                  <SelectItem value="enfermeiro_obstetra">Enfermeiro(a) Obstetra</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {filteredProfessionals.map(p => {
                const isSelected = formData.assignedProfessionals?.some(ap => ap.id === p.id);
                return (
                  <Button key={p.id} type="button" size="sm" className="h-7 text-[11px] px-2" variant={isSelected ? "default" : "outline"} onClick={() => toggleProfessional(p.id, p.name)}>
                    {p.name} {p.specialty ? `(${specialtyLabel(p.specialty)})` : ""}
                  </Button>
                );
              })}
              {filteredProfessionals.length === 0 && <p className="text-[10px] text-muted-foreground">Nenhum profissional</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patient Data */}
      <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
        <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-xs font-heading">Dados da Gestante</CardTitle></CardHeader>
        <CardContent className="px-4 pb-3 space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border shrink-0 overflow-hidden">
              {formData.patientPhoto ? <img src={formData.patientPhoto} alt="" className="w-12 h-12 rounded-full object-cover" /> : <span className="text-[10px] text-muted-foreground font-heading">Foto</span>}
            </div>
            <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleFileUpload("image/*", urls => { if (urls[0]) updateForm("patientPhoto", urls[0]); })}>
              {formData.patientPhoto ? "Trocar" : "Foto"}
            </Button>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            <div className="space-y-0.5 col-span-2"><Label className="text-[10px] font-heading">Nome Completo *</Label><Input value={formData.fullName} onChange={e => { updateForm("fullName", e.target.value); updateForm("patientName", e.target.value); }} className="rounded-xl h-9 text-sm" disabled={cpfLocked} /></div>
            <div className="space-y-0.5"><Label className="text-[10px] font-heading">Nº Registro</Label><Input value={formData.prontuarioNumber} readOnly className="rounded-xl h-9 text-sm bg-muted" /></div>
            <div className="space-y-0.5"><Label className="text-[10px] font-heading">Nascimento</Label><Input type="date" value={formData.birthDate} onChange={e => updateForm("birthDate", e.target.value)} className="rounded-xl h-9 text-sm" disabled={cpfLocked} /></div>
            <div className="space-y-0.5"><Label className="text-[10px] font-heading">Telefone</Label><Input value={formData.phone} onChange={e => updateForm("phone", e.target.value)} className="rounded-xl h-9 text-sm" /></div>
            <div className="space-y-0.5"><Label className="text-[10px] font-heading">Estado Civil</Label><Input value={formData.maritalStatus} onChange={e => updateForm("maritalStatus", e.target.value)} className="rounded-xl h-9 text-sm" /></div>
            <div className="space-y-0.5"><Label className="text-[10px] font-heading">Profissão</Label><Input value={formData.profession} onChange={e => updateForm("profession", e.target.value)} className="rounded-xl h-9 text-sm" /></div>
            <div className="space-y-0.5"><Label className="text-[10px] font-heading">Contato Emergência</Label><Input value={formData.emergencyContact} onChange={e => updateForm("emergencyContact", e.target.value)} className="rounded-xl h-9 text-sm" /></div>
            <div className="space-y-0.5 col-span-3 md:col-span-4"><Label className="text-[10px] font-heading">Endereço</Label><Input value={formData.address} onChange={e => updateForm("address", e.target.value)} className="rounded-xl h-9 text-sm" disabled={cpfLocked} /></div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Checkbox checked={formData.consentSigned} onCheckedChange={v => updateForm("consentSigned", !!v)} />
            <Label className="text-[10px] font-heading font-semibold">Termo de consentimento assinado</Label>
          </div>
        </CardContent>
      </Card>

      {/* Gestational Card */}
      <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
        <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-xs font-heading">Cartão da Gestante</CardTitle></CardHeader>
        <CardContent className="px-4 pb-3 space-y-2">
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            <div className="space-y-0.5">
              <Label className="text-[10px] font-heading">Tipo Sang.</Label>
              <Select value={formData.gestationalCard.bloodType} onValueChange={v => updateGestCard("bloodType", v)}>
                <SelectTrigger className="rounded-xl h-9 text-sm"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{["A", "B", "AB", "O"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-0.5">
              <Label className="text-[10px] font-heading">Rh</Label>
              <Select value={formData.gestationalCard.rh} onValueChange={v => updateGestCard("rh", v)}>
                <SelectTrigger className="rounded-xl h-9 text-sm"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent><SelectItem value="+">+</SelectItem><SelectItem value="-">-</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-0.5 col-span-2"><Label className="text-[10px] font-heading">DUM</Label><Input type="date" value={formData.gestationalCard.dum} onChange={e => updateGestCard("dum", e.target.value)} className="rounded-xl h-9 text-sm" /></div>
            <div className="space-y-0.5 col-span-2"><Label className="text-[10px] font-heading">DPP (auto)</Label><Input value={formData.gestationalCard.dpp} readOnly className="rounded-xl h-9 text-sm bg-muted" /></div>
            {formData.gestationalCard.dum && (
              <div className="space-y-0.5 col-span-2 flex items-end">
                <span className="text-xs text-muted-foreground pb-2">IG: <span className="font-semibold text-foreground">{calcGestationalAge(formData.gestationalCard.dum)}</span></span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            <div className="space-y-0.5"><Label className="text-[10px] font-heading">G</Label><Input value={formData.gestationalCard.gravida} onChange={e => updateGestCard("gravida", e.target.value)} className="rounded-xl h-9 text-sm" /></div>
            <div className="space-y-0.5"><Label className="text-[10px] font-heading">P</Label><Input value={formData.gestationalCard.para} onChange={e => updateGestCard("para", e.target.value)} className="rounded-xl h-9 text-sm" /></div>
            <div className="space-y-0.5"><Label className="text-[10px] font-heading">A</Label><Input value={formData.gestationalCard.abortions} onChange={e => updateGestCard("abortions", e.target.value)} className="rounded-xl h-9 text-sm" /></div>
            <div className="space-y-0.5"><Label className="text-[10px] font-heading">Peso Pré (kg)</Label><Input value={formData.gestationalCard.preGestationalWeight} onChange={e => updateGestCard("preGestationalWeight", e.target.value)} className="rounded-xl h-9 text-sm" /></div>
            <div className="space-y-0.5"><Label className="text-[10px] font-heading">Altura (m)</Label><Input value={formData.gestationalCard.height} onChange={e => updateGestCard("height", e.target.value)} className="rounded-xl h-9 text-sm" /></div>
            <div className="space-y-0.5"><Label className="text-[10px] font-heading">IMC (auto)</Label><Input value={formData.gestationalCard.preGestationalBmi} readOnly className="rounded-xl h-9 text-sm bg-muted" /></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div className="space-y-0.5"><Label className="text-[10px] font-heading">Alergias</Label><Input value={formData.gestationalCard.allergies} onChange={e => updateGestCard("allergies", e.target.value)} className="rounded-xl h-9 text-sm" /></div>
            <div className="space-y-0.5"><Label className="text-[10px] font-heading">Medicamentos</Label><Input value={formData.gestationalCard.medications} onChange={e => updateGestCard("medications", e.target.value)} className="rounded-xl h-9 text-sm" /></div>
            <div className="space-y-0.5"><Label className="text-[10px] font-heading">Condições pré-existentes</Label><Input value={formData.gestationalCard.preExistingConditions} onChange={e => updateGestCard("preExistingConditions", e.target.value)} className="rounded-xl h-9 text-sm" /></div>
            <div className="space-y-0.5"><Label className="text-[10px] font-heading">Cirurgias anteriores</Label><Input value={formData.gestationalCard.previousSurgeries} onChange={e => updateGestCard("previousSurgeries", e.target.value)} className="rounded-xl h-9 text-sm" /></div>
            <div className="space-y-0.5"><Label className="text-[10px] font-heading">Histórico familiar</Label><Input value={formData.gestationalCard.familyHistory} onChange={e => updateGestCard("familyHistory", e.target.value)} className="rounded-xl h-9 text-sm" /></div>
            <div className="space-y-0.5">
              <Label className="text-[10px] font-heading">Classif. Risco</Label>
              <Select value={formData.gestationalCard.riskClassification} onValueChange={(v: any) => updateGestCard("riskClassification", v)}>
                <SelectTrigger className="rounded-xl h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="habitual">Risco Habitual</SelectItem><SelectItem value="alto_risco">Alto Risco</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <Separator className="my-1" />
          <p className="text-[10px] font-heading font-semibold text-foreground">Plano de Parto e Apoio</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="space-y-0.5"><Label className="text-[10px] font-heading">Acompanhante</Label><Input value={formData.gestationalCard.companion} onChange={e => updateGestCard("companion", e.target.value)} className="rounded-xl h-9 text-sm" /></div>
            <div className="space-y-0.5"><Label className="text-[10px] font-heading">Tel. Acompanhante</Label><Input value={formData.gestationalCard.companionPhone} onChange={e => updateGestCard("companionPhone", e.target.value)} className="rounded-xl h-9 text-sm" /></div>
            <div className="space-y-0.5"><Label className="text-[10px] font-heading">Pediatra</Label><Input value={formData.gestationalCard.pediatrician} onChange={e => updateGestCard("pediatrician", e.target.value)} className="rounded-xl h-9 text-sm" /></div>
            <div className="space-y-0.5"><Label className="text-[10px] font-heading">Hospital/Maternidade</Label><Input value={formData.gestationalCard.hospital} onChange={e => updateGestCard("hospital", e.target.value)} className="rounded-xl h-9 text-sm" /></div>
            <div className="space-y-0.5 col-span-2 md:col-span-4"><Label className="text-[10px] font-heading">Plano de Parto</Label><Textarea value={formData.gestationalCard.birthPlan} onChange={e => updateGestCard("birthPlan", e.target.value)} className="rounded-xl min-h-[50px] text-sm" /></div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 pb-4">
        <Button variant="outline" onClick={onCancel} className="flex-1 h-9">Cancelar</Button>
        <Button variant="secondary" onClick={handleSave} className="flex-1 h-9">{initialData ? "Salvar Alterações" : "Criar Registro"}</Button>
      </div>
    </div>
  );
};

export default ClinicalRecordForm;
