import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useClinicalRecords, type ClinicalRecord, type PrenatalConsultation, type ConsultationExamRequest } from "@/contexts/ClinicalRecordContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { calcGestationalAgeAtDate, calcGestationalWeeks, suggestNextAppointment, getTrimesterFromIG, EXAMS_BY_TRIMESTER, parseBloodPressure } from "./constants";

interface ConsultationsTabProps {
  record: ClinicalRecord;
  onRecordUpdate: (r: ClinicalRecord) => void;
}

const emptyConsultForm = (userName: string): Omit<PrenatalConsultation, "id"> => ({
  date: new Date().toISOString().split("T")[0], gestationalAge: "", weight: "", bloodPressure: "",
  uterineHeight: "", fetalHeartRate: "", edema: "Ausente", fetalPresentation: "",
  observations: "", conduct: "", professional: userName, nextAppointment: "", status: "agendada",
  requestedExams: [],
});

const ConsultationsTab = ({ record, onRecordUpdate }: ConsultationsTabProps) => {
  const { user } = useAuth();
  const { addPrenatalConsultation, updatePrenatalConsultation, addGestationalExam } = useClinicalRecords();
  const dum = record.gestationalCard.dum;
  const igWeeks = calcGestationalWeeks(dum);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<PrenatalConsultation | null>(null);
  const [consultForm, setConsultForm] = useState<Omit<PrenatalConsultation, "id">>(emptyConsultForm(user?.name || ""));

  // Stepper for "Realizar Consulta"
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  const openNewConsultation = () => {
    const today = new Date().toISOString().split("T")[0];
    const autoIG = calcGestationalAgeAtDate(dum, today);
    setConsultForm({ ...emptyConsultForm(user?.name || ""), date: today, gestationalAge: autoIG });
    setDialogOpen(true);
  };

  const openConsultDetail = useCallback((c: PrenatalConsultation) => {
    setSelectedConsultation({ ...c });
    setStep(1);
    setDetailOpen(true);
  }, []);

  const handleAddConsultation = () => {
    if (!consultForm.date) return;
    addPrenatalConsultation(record.id, consultForm);
    const newC = { ...consultForm, id: `pc${Date.now()}` };
    onRecordUpdate({ ...record, prenatalConsultations: [...record.prenatalConsultations, newC] });
    setDialogOpen(false);
    setConsultForm(emptyConsultForm(user?.name || ""));
    toast({ title: "Consulta registrada!" });
  };

  const handleRealizarConsulta = () => {
    if (!selectedConsultation) return;
    const updated = { ...selectedConsultation, status: "realizada" as const };

    // Add requested exams to the exams tab
    if (updated.requestedExams?.length) {
      updated.requestedExams.forEach(ex => {
        if (ex.status === "solicitado") {
          const trimester = getTrimesterFromIG(calcGestationalWeeks(dum, updated.date));
          addGestationalExam(record.id, {
            date: updated.date,
            type: ex.examName,
            result: "",
            observations: ex.observations || "Solicitado na consulta",
            fileUrl: "",
            trimester,
            interpretation: "",
            referenceValues: "",
            requestedBy: updated.professional,
            laboratory: "",
          });
        }
      });
    }

    updatePrenatalConsultation(record.id, selectedConsultation.id, updated);
    const newConsults = record.prenatalConsultations.map(c => c.id === selectedConsultation.id ? updated : c);

    // Also add exams to local state
    const newExams = [...record.gestationalExams];
    if (updated.requestedExams?.length) {
      updated.requestedExams.forEach(ex => {
        if (ex.status === "solicitado") {
          newExams.push({
            id: `ge${Date.now()}-${Math.random()}`,
            date: updated.date,
            type: ex.examName,
            result: "",
            observations: "Solicitado na consulta",
            fileUrl: "",
            trimester: getTrimesterFromIG(calcGestationalWeeks(dum, updated.date)),
            interpretation: "",
            referenceValues: "",
            requestedBy: updated.professional,
            laboratory: "",
          });
        }
      });
    }

    onRecordUpdate({ ...record, prenatalConsultations: newConsults, gestationalExams: newExams });
    setDetailOpen(false);
    toast({ title: "Consulta realizada!" });
  };

  const handleCancelarConsulta = () => {
    if (!selectedConsultation) return;
    updatePrenatalConsultation(record.id, selectedConsultation.id, { status: "cancelada" });
    onRecordUpdate({ ...record, prenatalConsultations: record.prenatalConsultations.map(c => c.id === selectedConsultation.id ? { ...c, status: "cancelada" } : c) });
    setDetailOpen(false);
    toast({ title: "Consulta cancelada" });
  };

  // Suggested exams for current trimester
  const currentTrimester = getTrimesterFromIG(igWeeks);
  const suggestedExams = EXAMS_BY_TRIMESTER[currentTrimester] || [];

  // Exam request helpers
  const toggleExamRequest = (examName: string) => {
    if (!selectedConsultation) return;
    const reqs = selectedConsultation.requestedExams || [];
    const exists = reqs.some(r => r.examName === examName);
    setSelectedConsultation({
      ...selectedConsultation,
      requestedExams: exists
        ? reqs.filter(r => r.examName !== examName)
        : [...reqs, { id: crypto.randomUUID(), examName, trimester: currentTrimester, observations: "", status: "solicitado" }],
    });
  };

  const addCustomExam = (name: string) => {
    if (!selectedConsultation || !name.trim()) return;
    const reqs = selectedConsultation.requestedExams || [];
    setSelectedConsultation({
      ...selectedConsultation,
      requestedExams: [...reqs, { id: crypto.randomUUID(), examName: name.trim(), trimester: currentTrimester, observations: "", status: "solicitado" }],
    });
  };

  // PA alert
  const hasBPAlert = (c: PrenatalConsultation) => {
    const bp = parseBloodPressure(c.bloodPressure);
    return bp && (bp.systolic >= 140 || bp.diastolic >= 90);
  };

  // Render step content for "Realizar Consulta"
  const renderStep = () => {
    if (!selectedConsultation) return null;
    const sc = selectedConsultation;
    const updateSC = (fields: Partial<PrenatalConsultation>) => setSelectedConsultation({ ...sc, ...fields });

    switch (step) {
      case 1: // Sinais Vitais
        return (
          <div className="space-y-3">
            <p className="text-xs font-heading font-bold text-foreground">Passo 1 — Sinais Vitais</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label className="text-xs font-heading">Peso (kg) *</Label><Input value={sc.weight} onChange={e => updateSC({ weight: e.target.value })} className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label className="text-xs font-heading">PA *</Label><Input value={sc.bloodPressure} onChange={e => updateSC({ bloodPressure: e.target.value })} className="rounded-xl" placeholder="120/80" /></div>
              <div className="space-y-1.5"><Label className="text-xs font-heading">AU (cm)</Label><Input value={sc.uterineHeight} onChange={e => updateSC({ uterineHeight: e.target.value })} className="rounded-xl" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label className="text-xs font-heading">BCF (bpm)</Label><Input value={sc.fetalHeartRate} onChange={e => updateSC({ fetalHeartRate: e.target.value })} className="rounded-xl" /></div>
              <div className="space-y-1.5">
                <Label className="text-xs font-heading">Edema</Label>
                <Select value={sc.edema} onValueChange={v => updateSC({ edema: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Ausente">Ausente</SelectItem><SelectItem value="+">+</SelectItem><SelectItem value="++">++</SelectItem><SelectItem value="+++">+++</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs font-heading">Apresentação</Label><Input value={sc.fetalPresentation} onChange={e => updateSC({ fetalPresentation: e.target.value })} className="rounded-xl" /></div>
            </div>
          </div>
        );
      case 2: // Avaliação Clínica
        return (
          <div className="space-y-3">
            <p className="text-xs font-heading font-bold text-foreground">Passo 2 — Avaliação Clínica</p>
            <div className="space-y-1.5"><Label className="text-xs font-heading">Observações Clínicas</Label><Textarea value={sc.observations} onChange={e => updateSC({ observations: e.target.value })} className="rounded-xl min-h-[80px]" /></div>
            <div className="space-y-1.5"><Label className="text-xs font-heading">Conduta</Label><Textarea value={sc.conduct} onChange={e => updateSC({ conduct: e.target.value })} className="rounded-xl min-h-[60px]" /></div>
          </div>
        );
      case 3: // Exames
        return (
          <div className="space-y-3">
            <p className="text-xs font-heading font-bold text-foreground">Passo 3 — Solicitação de Exames</p>
            <p className="text-[10px] text-muted-foreground">Exames sugeridos para o {currentTrimester}º trimestre (IG {igWeeks}s):</p>
            <div className="flex flex-wrap gap-1.5">
              {suggestedExams.map(ex => {
                const isAdded = (sc.requestedExams || []).some(r => r.examName === ex);
                return (
                  <button key={ex} onClick={() => toggleExamRequest(ex)} className={`text-[10px] px-2 py-1 rounded-full font-heading transition-colors ${isAdded ? "bg-secondary text-secondary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}>
                    {isAdded ? "✓ " : "+ "}{ex}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <Label className="text-[10px] font-heading">Outro exame</Label>
                <Input id="step-custom-exam" placeholder="Nome do exame" className="rounded-xl h-7 text-xs" />
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => {
                const input = document.getElementById("step-custom-exam") as HTMLInputElement;
                if (input?.value) { addCustomExam(input.value); input.value = ""; }
              }}>Adicionar</Button>
            </div>
            {(sc.requestedExams || []).length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-heading font-semibold">Exames solicitados ({(sc.requestedExams || []).length}):</p>
                {(sc.requestedExams || []).map(ex => (
                  <div key={ex.id} className="flex items-center justify-between bg-white/30 rounded-lg px-2 py-1">
                    <span className="text-[11px] font-heading text-foreground">{ex.examName}</span>
                    <button onClick={() => setSelectedConsultation({ ...sc, requestedExams: (sc.requestedExams || []).filter(r => r.id !== ex.id) })} className="text-[10px] text-destructive hover:underline">Remover</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 4: // Prescrições
        return (
          <div className="space-y-3">
            <p className="text-xs font-heading font-bold text-foreground">Passo 4 — Prescrições e Orientações</p>
            <div className="space-y-1.5"><Label className="text-xs font-heading">Prescrições / Receitas</Label><Textarea value={sc.conduct} onChange={e => updateSC({ conduct: e.target.value })} className="rounded-xl min-h-[80px]" placeholder="Medicamentos, suplementos, orientações..." /></div>
            <div className="space-y-1.5"><Label className="text-xs font-heading">Profissional</Label><Input value={sc.professional} onChange={e => updateSC({ professional: e.target.value })} className="rounded-xl" /></div>
          </div>
        );
      case 5: // Agendamento
        return (
          <div className="space-y-3">
            <p className="text-xs font-heading font-bold text-foreground">Passo 5 — Próxima Consulta</p>
            <p className="text-[10px] text-muted-foreground">
              Intervalo sugerido: {igWeeks >= 36 ? "semanal" : igWeeks >= 28 ? "quinzenal" : "mensal"} (IG {igWeeks}s)
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs font-heading">Data da Próxima Consulta</Label>
              <Input type="date" value={sc.nextAppointment || suggestNextAppointment(igWeeks)} onChange={e => updateSC({ nextAppointment: e.target.value })} className="rounded-xl" />
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="secondary" size="sm" onClick={openNewConsultation}>Nova Consulta</Button>
      </div>

      {record.prenatalConsultations.length === 0 ? (
        <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg">
          <CardContent className="p-8 text-center"><p className="text-sm text-muted-foreground font-heading">Nenhuma consulta registrada</p></CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {record.prenatalConsultations.map((c, idx) => (
            <Card key={c.id} className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg cursor-pointer hover:shadow-xl transition-shadow" onClick={() => openConsultDetail(c)}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-heading font-bold text-sm text-foreground">Consulta #{idx + 1}</h4>
                      <Badge variant={c.status === "realizada" ? "default" : c.status === "cancelada" ? "destructive" : "secondary"} className="text-[10px] font-heading">
                        {c.status === "realizada" ? "Realizada" : c.status === "cancelada" ? "Cancelada" : "Agendada"}
                      </Badge>
                      {hasBPAlert(c) && <Badge variant="destructive" className="text-[9px]">PA</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{format(new Date(c.date), "dd/MM/yyyy", { locale: ptBR })} • {c.gestationalAge || "—"}</p>
                  </div>
                  {c.professional && <span className="text-xs text-muted-foreground">{c.professional}</span>}
                </div>
                {c.status === "realizada" && (
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {[
                      { label: "Peso", value: c.weight ? `${c.weight}kg` : "" },
                      { label: "PA", value: c.bloodPressure },
                      { label: "AU", value: c.uterineHeight ? `${c.uterineHeight}cm` : "" },
                      { label: "BCF", value: c.fetalHeartRate ? `${c.fetalHeartRate}bpm` : "" },
                      { label: "Edema", value: c.edema },
                      { label: "Apresentação", value: c.fetalPresentation },
                    ].filter(v => v.value).map(item => (
                      <div key={item.label} className="bg-white/30 rounded-lg p-2 text-center">
                        <p className="text-[10px] text-muted-foreground font-heading">{item.label}</p>
                        <p className="text-xs font-heading font-semibold text-foreground">{item.value}</p>
                      </div>
                    ))}
                  </div>
                )}
                {(c.requestedExams || []).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(c.requestedExams || []).map(ex => (
                      <Badge key={ex.id} variant={ex.status === "realizado" ? "default" : "outline"} className="text-[9px]">{ex.examName}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Consultation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading">Agendar / Registrar Consulta</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs font-heading">Data *</Label><Input type="date" value={consultForm.date} onChange={e => {
                const autoIG = calcGestationalAgeAtDate(dum, e.target.value);
                setConsultForm({ ...consultForm, date: e.target.value, gestationalAge: autoIG || consultForm.gestationalAge });
              }} className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label className="text-xs font-heading">IG {dum ? "(auto)" : ""}</Label><Input value={consultForm.gestationalAge} readOnly={!!dum} onChange={e => setConsultForm({ ...consultForm, gestationalAge: e.target.value })} className="rounded-xl bg-muted/30" /></div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-heading">Status</Label>
              <Select value={consultForm.status} onValueChange={(v: any) => setConsultForm({ ...consultForm, status: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="agendada">Agendada</SelectItem><SelectItem value="realizada">Realizada</SelectItem></SelectContent>
              </Select>
            </div>
            {consultForm.status === "realizada" && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5"><Label className="text-xs font-heading">Peso (kg)</Label><Input value={consultForm.weight} onChange={e => setConsultForm({ ...consultForm, weight: e.target.value })} className="rounded-xl" /></div>
                  <div className="space-y-1.5"><Label className="text-xs font-heading">PA</Label><Input value={consultForm.bloodPressure} onChange={e => setConsultForm({ ...consultForm, bloodPressure: e.target.value })} className="rounded-xl" /></div>
                  <div className="space-y-1.5"><Label className="text-xs font-heading">AU (cm)</Label><Input value={consultForm.uterineHeight} onChange={e => setConsultForm({ ...consultForm, uterineHeight: e.target.value })} className="rounded-xl" /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5"><Label className="text-xs font-heading">BCF (bpm)</Label><Input value={consultForm.fetalHeartRate} onChange={e => setConsultForm({ ...consultForm, fetalHeartRate: e.target.value })} className="rounded-xl" /></div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-heading">Edema</Label>
                    <Select value={consultForm.edema} onValueChange={v => setConsultForm({ ...consultForm, edema: v })}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="Ausente">Ausente</SelectItem><SelectItem value="+">+</SelectItem><SelectItem value="++">++</SelectItem><SelectItem value="+++">+++</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label className="text-xs font-heading">Apresentação</Label><Input value={consultForm.fetalPresentation} onChange={e => setConsultForm({ ...consultForm, fetalPresentation: e.target.value })} className="rounded-xl" /></div>
                </div>
                <div className="space-y-1.5"><Label className="text-xs font-heading">Observações</Label><Textarea value={consultForm.observations} onChange={e => setConsultForm({ ...consultForm, observations: e.target.value })} className="rounded-xl min-h-[50px]" /></div>
                <div className="space-y-1.5"><Label className="text-xs font-heading">Conduta</Label><Textarea value={consultForm.conduct} onChange={e => setConsultForm({ ...consultForm, conduct: e.target.value })} className="rounded-xl min-h-[50px]" /></div>
              </>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs font-heading">Profissional</Label><Input value={consultForm.professional} onChange={e => setConsultForm({ ...consultForm, professional: e.target.value })} className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label className="text-xs font-heading">Próxima Consulta</Label><Input type="date" value={consultForm.nextAppointment} onChange={e => setConsultForm({ ...consultForm, nextAppointment: e.target.value })} className="rounded-xl" /></div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">Cancelar</Button>
              <Button variant="secondary" onClick={handleAddConsultation} className="flex-1">Registrar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Consultation Detail / Realizar Dialog with Stepper */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading">Detalhes da Consulta</DialogTitle></DialogHeader>
          {selectedConsultation && (
            <div className="space-y-3 mt-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-heading">{format(new Date(selectedConsultation.date), "dd/MM/yyyy")} • {selectedConsultation.gestationalAge || "—"}</p>
                <Badge variant={selectedConsultation.status === "realizada" ? "default" : selectedConsultation.status === "cancelada" ? "destructive" : "secondary"} className="text-xs font-heading">
                  {selectedConsultation.status === "realizada" ? "Realizada" : selectedConsultation.status === "cancelada" ? "Cancelada" : "Agendada"}
                </Badge>
              </div>

              {selectedConsultation.status === "agendada" && (
                <>
                  {/* Stepper */}
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: totalSteps }, (_, i) => i + 1).map(s => (
                      <button key={s} onClick={() => setStep(s)} className={`flex-1 h-2 rounded-full transition-colors ${s <= step ? "bg-secondary" : "bg-muted/40"}`} />
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center">{step} de {totalSteps}</p>

                  <Separator />
                  {renderStep()}

                  <div className="flex gap-2 pt-2">
                    {step > 1 && <Button variant="outline" size="sm" onClick={() => setStep(step - 1)}>Anterior</Button>}
                    <div className="flex-1" />
                    {step < totalSteps ? (
                      <Button variant="secondary" size="sm" onClick={() => setStep(step + 1)}>Próximo</Button>
                    ) : (
                      <Button variant="secondary" size="sm" onClick={handleRealizarConsulta}>✓ Realizar Consulta</Button>
                    )}
                  </div>

                  <Separator />
                  <Button variant="outline" size="sm" onClick={handleCancelarConsulta} className="w-full text-destructive hover:text-destructive">Cancelar Consulta</Button>
                </>
              )}

              {selectedConsultation.status === "realizada" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {[
                      { label: "Peso", value: selectedConsultation.weight ? `${selectedConsultation.weight}kg` : "—" },
                      { label: "PA", value: selectedConsultation.bloodPressure || "—" },
                      { label: "AU", value: selectedConsultation.uterineHeight ? `${selectedConsultation.uterineHeight}cm` : "—" },
                      { label: "BCF", value: selectedConsultation.fetalHeartRate ? `${selectedConsultation.fetalHeartRate}bpm` : "—" },
                      { label: "Edema", value: selectedConsultation.edema || "—" },
                      { label: "Apresentação", value: selectedConsultation.fetalPresentation || "—" },
                    ].map(item => (
                      <div key={item.label} className="bg-white/30 rounded-lg p-2 text-center">
                        <p className="text-[10px] text-muted-foreground font-heading">{item.label}</p>
                        <p className="text-xs font-heading font-semibold text-foreground">{item.value}</p>
                      </div>
                    ))}
                  </div>
                  {selectedConsultation.observations && <div className="text-xs"><span className="text-muted-foreground">Observações:</span> {selectedConsultation.observations}</div>}
                  {selectedConsultation.conduct && <div className="text-xs"><span className="text-muted-foreground">Conduta:</span> {selectedConsultation.conduct}</div>}
                  {selectedConsultation.professional && <div className="text-xs text-muted-foreground">Profissional: {selectedConsultation.professional}</div>}
                  {(selectedConsultation.requestedExams || []).length > 0 && (
                    <div className="mt-2">
                      <Separator className="mb-2" />
                      <p className="text-[10px] font-heading font-semibold mb-1">Exames Solicitados ({selectedConsultation.requestedExams!.length}):</p>
                      <div className="space-y-1">
                        {selectedConsultation.requestedExams!.map(ex => (
                          <div key={ex.id} className="flex items-center justify-between bg-white/30 rounded-lg px-2 py-1">
                            <span className="text-[11px] font-heading text-foreground">{ex.examName}</span>
                            <Badge variant={ex.status === "realizado" ? "default" : "secondary"} className="text-[9px] font-heading">{ex.status === "realizado" ? "Realizado" : "Solicitado"}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedConsultation.status === "cancelada" && (
                <p className="text-sm text-muted-foreground text-center py-4">Esta consulta foi cancelada.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConsultationsTab;
