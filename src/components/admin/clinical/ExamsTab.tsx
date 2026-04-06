import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useClinicalRecords, type ClinicalRecord, type GestationalExam } from "@/contexts/ClinicalRecordContext";
import { format } from "date-fns";
import { calcGestationalWeeks, getTrimesterFromIG, EXAMS_BY_TRIMESTER } from "./constants";

interface ExamsTabProps {
  record: ClinicalRecord;
  onRecordUpdate: (r: ClinicalRecord) => void;
}

const ExamsTab = ({ record, onRecordUpdate }: ExamsTabProps) => {
  const { user } = useAuth();
  const { addGestationalExam } = useClinicalRecords();
  const dum = record.gestationalCard.dum;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<GestationalExam | null>(null);

  // Auto-calculate trimester from date
  const autoTrimester = (date: string): "1" | "2" | "3" => {
    if (!dum) return "1";
    return getTrimesterFromIG(calcGestationalWeeks(dum, date));
  };

  const [examForm, setExamForm] = useState<Omit<GestationalExam, "id">>({
    date: new Date().toISOString().split("T")[0], type: "", result: "", observations: "", fileUrl: "",
    trimester: autoTrimester(new Date().toISOString().split("T")[0]),
    interpretation: "", referenceValues: "", requestedBy: user?.name || "", laboratory: "",
  });

  const handleAdd = () => {
    if (!examForm.type) return;
    addGestationalExam(record.id, examForm);
    const newExam = { ...examForm, id: `ge${Date.now()}` };
    onRecordUpdate({ ...record, gestationalExams: [...record.gestationalExams, newExam] });
    setDialogOpen(false);
    setExamForm({ date: new Date().toISOString().split("T")[0], type: "", result: "", observations: "", fileUrl: "", trimester: autoTrimester(new Date().toISOString().split("T")[0]), interpretation: "", referenceValues: "", requestedBy: user?.name || "", laboratory: "" });
    toast({ title: "Exame registrado!" });
  };

  const examsByTrimester = (tri: string) => record.gestationalExams.filter(e => e.trimester === tri);
  const getExamsDone = (tri: string) => examsByTrimester(tri).map(e => e.type);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="secondary" size="sm" onClick={() => setDialogOpen(true)}>Novo Exame</Button>
      </div>

      {(["1", "2", "3"] as const).map(tri => {
        const done = getExamsDone(tri);
        const expected = EXAMS_BY_TRIMESTER[tri];
        const exams = examsByTrimester(tri);
        return (
          <Card key={tri} className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-heading flex items-center justify-between">
                <span>{tri}º Trimestre</span>
                <span className="text-xs text-muted-foreground font-normal">{done.length}/{expected.length} realizados</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap gap-1 mb-3">
                {expected.map(examName => {
                  const isDone = done.includes(examName);
                  return <Badge key={examName} variant={isDone ? "default" : "outline"} className="text-[10px] font-heading">{isDone ? "✓ " : ""}{examName}</Badge>;
                })}
              </div>
              {exams.map(exam => (
                <div key={exam.id} className="bg-white/30 backdrop-blur-lg rounded-xl p-3 cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setSelectedExam(exam); setDetailOpen(true); }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-heading font-bold text-foreground">{exam.type}</p>
                      <p className="text-[10px] text-muted-foreground">{format(new Date(exam.date), "dd/MM/yyyy")} {exam.laboratory ? `• ${exam.laboratory}` : ""}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {exam.interpretation && (
                        <Badge variant={exam.interpretation === "normal" ? "default" : exam.interpretation === "alterado" ? "destructive" : "secondary"} className="text-[9px] font-heading">
                          {exam.interpretation === "normal" ? "Normal" : exam.interpretation === "alterado" ? "Alterado" : "Inconcl."}
                        </Badge>
                      )}
                      {!exam.result && <Badge variant="outline" className="text-[9px] font-heading">Aguardando</Badge>}
                    </div>
                  </div>
                  {exam.result && <p className="text-[11px] text-muted-foreground mt-1 truncate">{exam.result}</p>}
                </div>
              ))}
              {exams.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">Nenhum exame registrado</p>}
            </CardContent>
          </Card>
        );
      })}

      {/* New Exam Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading">Registrar Exame</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs font-heading">Data</Label><Input type="date" value={examForm.date} onChange={e => setExamForm({ ...examForm, date: e.target.value, trimester: autoTrimester(e.target.value) })} className="rounded-xl" /></div>
              <div className="space-y-1.5">
                <Label className="text-xs font-heading">Trimestre {dum ? "(auto)" : ""}</Label>
                <Select value={examForm.trimester} onValueChange={(v: any) => setExamForm({ ...examForm, trimester: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="1">1º Trimestre</SelectItem><SelectItem value="2">2º Trimestre</SelectItem><SelectItem value="3">3º Trimestre</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-heading">Tipo de Exame *</Label>
              <Select value={examForm.type} onValueChange={v => setExamForm({ ...examForm, type: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {EXAMS_BY_TRIMESTER[examForm.trimester].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-heading">Resultado</Label><Textarea value={examForm.result} onChange={e => setExamForm({ ...examForm, result: e.target.value })} className="rounded-xl min-h-[60px]" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-heading">Interpretação</Label>
                <Select value={examForm.interpretation || "none"} onValueChange={v => setExamForm({ ...examForm, interpretation: v === "none" ? "" : v as any })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="none">—</SelectItem><SelectItem value="normal">Normal</SelectItem><SelectItem value="alterado">Alterado</SelectItem><SelectItem value="inconclusivo">Inconclusivo</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs font-heading">Laboratório</Label><Input value={examForm.laboratory} onChange={e => setExamForm({ ...examForm, laboratory: e.target.value })} className="rounded-xl" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs font-heading">Valores de Referência</Label><Input value={examForm.referenceValues} onChange={e => setExamForm({ ...examForm, referenceValues: e.target.value })} className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label className="text-xs font-heading">Solicitado por</Label><Input value={examForm.requestedBy} onChange={e => setExamForm({ ...examForm, requestedBy: e.target.value })} className="rounded-xl" /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-heading">Observações</Label><Input value={examForm.observations} onChange={e => setExamForm({ ...examForm, observations: e.target.value })} className="rounded-xl" /></div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">Cancelar</Button>
              <Button variant="secondary" onClick={handleAdd} className="flex-1">Registrar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Exam Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-heading">Detalhes do Exame</DialogTitle></DialogHeader>
          {selectedExam && (
            <div className="space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Exame", value: selectedExam.type },
                  { label: "Data", value: format(new Date(selectedExam.date), "dd/MM/yyyy") },
                  { label: "Trimestre", value: `${selectedExam.trimester}º` },
                  { label: "Laboratório", value: selectedExam.laboratory || "—" },
                  { label: "Solicitado por", value: selectedExam.requestedBy || "—" },
                  { label: "Interpretação", value: selectedExam.interpretation === "normal" ? "Normal" : selectedExam.interpretation === "alterado" ? "Alterado" : selectedExam.interpretation === "inconclusivo" ? "Inconclusivo" : "—" },
                ].map(item => (
                  <div key={item.label} className="bg-white/30 rounded-xl p-3">
                    <p className="text-[10px] text-muted-foreground font-heading uppercase">{item.label}</p>
                    <p className="text-sm font-heading font-semibold text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>
              {selectedExam.referenceValues && (
                <div className="bg-white/30 rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground font-heading uppercase">Valores de Referência</p>
                  <p className="text-sm text-foreground">{selectedExam.referenceValues}</p>
                </div>
              )}
              <div className="bg-white/30 rounded-xl p-3">
                <p className="text-[10px] text-muted-foreground font-heading uppercase">Resultado</p>
                <p className="text-sm text-foreground">{selectedExam.result || "Aguardando resultado"}</p>
              </div>
              {selectedExam.observations && (
                <div className="bg-white/30 rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground font-heading uppercase">Observações</p>
                  <p className="text-sm text-foreground">{selectedExam.observations}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExamsTab;
