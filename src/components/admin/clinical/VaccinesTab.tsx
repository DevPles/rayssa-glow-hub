import { useState, Fragment } from "react";
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
import { useClinicalRecords, type ClinicalRecord, type Vaccine } from "@/contexts/ClinicalRecordContext";
import { format } from "date-fns";
import { VACCINES_BRAZIL, VACCINE_CATEGORIES, type VaccineCategory } from "./constants";

interface VaccinesTabProps {
  record: ClinicalRecord;
  onRecordUpdate: (r: ClinicalRecord) => void;
}

const VaccinesTab = ({ record, onRecordUpdate }: VaccinesTabProps) => {
  const { user } = useAuth();
  const { addVaccine } = useClinicalRecords();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [vaccineForm, setVaccineForm] = useState<Omit<Vaccine, "id">>({
    name: "", dose: "", date: new Date().toISOString().split("T")[0], lot: "", professional: user?.name || "", manufacturer: "", reaction: "",
  });

  const handleAdd = () => {
    if (!vaccineForm.name) return;
    addVaccine(record.id, vaccineForm);
    const newVac = { ...vaccineForm, id: `v${Date.now()}` };
    onRecordUpdate({ ...record, vaccines: [...(record.vaccines || []), newVac] });
    setDialogOpen(false);
    setVaccineForm({ name: "", dose: "", date: new Date().toISOString().split("T")[0], lot: "", professional: user?.name || "", manufacturer: "", reaction: "" });
    toast({ title: "Vacina registrada!" });
  };

  const vaccines = record.vaccines || [];

  // Dashboard counts
  const recommended = VACCINES_BRAZIL.filter(v => v.category === "recomendada");
  const appliedNames = vaccines.map(v => v.name);
  const appliedCount = recommended.filter(v => appliedNames.includes(v.name)).length;
  const pendingCount = recommended.length - appliedCount;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-3">
          <div className="bg-primary/10 rounded-xl px-3 py-2 text-center border border-primary/20">
            <p className="text-lg font-heading font-bold text-primary">{appliedCount}</p>
            <p className="text-[10px] text-primary/80">Aplicadas</p>
          </div>
          <div className="bg-secondary/10 rounded-xl px-3 py-2 text-center border border-secondary/20">
            <p className="text-lg font-heading font-bold text-secondary-foreground">{pendingCount}</p>
            <p className="text-[10px] text-secondary-foreground/80">Pendentes</p>
          </div>
          <div className="bg-muted/30 rounded-xl px-3 py-2 text-center border border-border">
            <p className="text-lg font-heading font-bold text-foreground">{vaccines.length}</p>
            <p className="text-[10px] text-muted-foreground">Total Reg.</p>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setDialogOpen(true)}>Registrar Vacina</Button>
      </div>

      {/* Calendar by category */}
      {VACCINE_CATEGORIES.map(({ key: cat, label: catLabel, color: catColor }) => {
        const catVaccines = VACCINES_BRAZIL.filter(v => v.category === cat);
        return (
          <Card key={cat} className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className={`text-sm font-heading ${catColor}`}>{catLabel}</CardTitle>
              {cat === "contraindicada" && <p className="text-[10px] text-destructive/80">Vacinas de vírus vivo atenuado — NÃO aplicar na gestação</p>}
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/30">
                      <th className="text-left py-2 px-2 font-heading text-muted-foreground">Vacina</th>
                      <th className="text-left py-2 px-2 font-heading text-muted-foreground">Período</th>
                      <th className="text-center py-2 px-2 font-heading text-muted-foreground">Doses</th>
                      <th className="text-center py-2 px-2 font-heading text-muted-foreground">Status</th>
                      <th className="text-left py-2 px-2 font-heading text-muted-foreground">Detalhes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catVaccines.map(vac => {
                      const applied = vaccines.filter(v => v.name === vac.name);
                      const allDone = vac.doses.length > 0 && vac.doses.every(d => applied.some(a => a.dose === d));
                      const statusLabel = cat === "contraindicada" ? "N/A" : allDone ? "Completa" : applied.length > 0 ? `${applied.length}/${vac.doses.length}` : "Pendente";
                      const statusColor = cat === "contraindicada" ? "text-destructive" : allDone ? "text-primary" : applied.length > 0 ? "text-secondary-foreground" : "text-muted-foreground";

                      return (
                        <Fragment key={vac.name}>
                          <tr className="border-b border-border/10 hover:bg-white/20">
                            <td className="py-2 px-2">
                              <span className="font-heading font-semibold text-foreground">{vac.name}</span>
                            </td>
                            <td className="py-2 px-2">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-heading ${cat === "contraindicada" ? "bg-destructive/10 text-destructive" : "bg-muted/50 text-foreground"}`}>{vac.trimester}</span>
                            </td>
                            <td className="py-2 px-2 text-center">
                              <div className="flex justify-center gap-0.5">
                                {vac.doses.map((dose, di) => {
                                  const doseApplied = applied.some(a => a.dose === dose);
                                  return (
                                    <span key={di} className={`w-4 h-4 rounded-full text-[8px] flex items-center justify-center font-bold ${doseApplied ? "bg-primary text-primary-foreground" : "bg-muted/60 text-muted-foreground"}`}>{di + 1}</span>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="py-2 px-2 text-center">
                              <span className={`text-[10px] font-heading font-semibold ${statusColor}`}>{statusLabel}</span>
                            </td>
                            <td className="py-2 px-2">
                              {applied.length > 0 ? (
                                <div className="space-y-1">
                                  {applied.map(v => (
                                    <div key={v.id} className="text-[10px] text-muted-foreground">
                                      <span className="font-medium text-foreground">{v.dose}</span> — {format(new Date(v.date), "dd/MM/yy")}
                                      {v.manufacturer && <span> · {v.manufacturer}</span>}
                                      {v.lot && <span> · Lote {v.lot}</span>}
                                      {v.reaction && <span className="text-destructive block">⚠ {v.reaction}</span>}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[10px] text-muted-foreground">—</span>
                              )}
                            </td>
                          </tr>
                          {applied.length > 0 && applied.some(v => v.reaction) && (
                            <tr><td colSpan={5} className="px-4 pb-2"><p className="text-[10px] text-destructive/80 italic">Reações comuns: {vac.commonReactions.join(", ")}</p></td></tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Custom vaccines */}
      {vaccines.filter(v => v.name === "Outra" && v.customName).length > 0 && (
        <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-heading">Vacinas Adicionais</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/30">
                    {["Vacina", "Dose", "Data", "Fabricante", "Lote", "Reação"].map(h => <th key={h} className="text-left py-2 px-2 font-heading text-muted-foreground">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {vaccines.filter(v => v.name === "Outra" && v.customName).map(v => (
                    <tr key={v.id} className="border-b border-border/20">
                      <td className="py-2 px-2 font-heading font-semibold text-foreground">{v.customName}</td>
                      <td className="py-2 px-2 text-muted-foreground">{v.dose}</td>
                      <td className="py-2 px-2 text-muted-foreground">{format(new Date(v.date), "dd/MM/yyyy")}</td>
                      <td className="py-2 px-2 text-muted-foreground">{v.manufacturer || "—"}</td>
                      <td className="py-2 px-2 text-muted-foreground">{v.lot || "—"}</td>
                      <td className="py-2 px-2 text-destructive">{v.reaction || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vaccine Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading">Registrar Vacina</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-heading">Vacina *</Label>
              <Select value={vaccineForm.name} onValueChange={v => setVaccineForm({ ...vaccineForm, name: v, customName: v === "Outra" ? "" : undefined })}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {VACCINES_BRAZIL.map(v => <SelectItem key={v.name} value={v.name}>{v.name}</SelectItem>)}
                  <SelectItem value="Outra">Outra (digitar nome)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {vaccineForm.name === "Outra" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-heading">Nome da Vacina *</Label>
                <Input value={vaccineForm.customName || ""} onChange={e => setVaccineForm({ ...vaccineForm, customName: e.target.value })} className="rounded-xl" placeholder="Digite o nome" />
              </div>
            )}
            {vaccineForm.name && vaccineForm.name !== "Outra" && (() => {
              const info = VACCINES_BRAZIL.find(v => v.name === vaccineForm.name);
              return info?.gestationalAlert ? (
                <div className={`rounded-lg p-2.5 text-[11px] ${info.gestationalAlert.includes("⚠️") ? "bg-destructive/10 text-destructive border border-destructive/20" : "bg-secondary/10 text-secondary-foreground border border-secondary/20"}`}>
                  {info.gestationalAlert}
                </div>
              ) : null;
            })()}
            <div className="space-y-1.5">
              <Label className="text-xs font-heading">Dose</Label>
              <Select value={vaccineForm.dose} onValueChange={v => setVaccineForm({ ...vaccineForm, dose: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {(VACCINES_BRAZIL.find(v => v.name === vaccineForm.name)?.doses || ["Dose Única", "1ª Dose", "2ª Dose", "3ª Dose", "Reforço"]).map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs font-heading">Data</Label><Input type="date" value={vaccineForm.date} onChange={e => setVaccineForm({ ...vaccineForm, date: e.target.value })} className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label className="text-xs font-heading">Lote</Label><Input value={vaccineForm.lot} onChange={e => setVaccineForm({ ...vaccineForm, lot: e.target.value })} className="rounded-xl" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs font-heading">Fabricante</Label><Input value={vaccineForm.manufacturer} onChange={e => setVaccineForm({ ...vaccineForm, manufacturer: e.target.value })} className="rounded-xl" placeholder="Ex: Butantan" /></div>
              <div className="space-y-1.5"><Label className="text-xs font-heading">Profissional</Label><Input value={vaccineForm.professional} onChange={e => setVaccineForm({ ...vaccineForm, professional: e.target.value })} className="rounded-xl" /></div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-heading">Reação Adversa</Label>
              <Textarea value={vaccineForm.reaction} onChange={e => setVaccineForm({ ...vaccineForm, reaction: e.target.value })} className="rounded-xl resize-none" rows={2} placeholder="Descreva reações observadas" />
            </div>
            {vaccineForm.name && vaccineForm.name !== "Outra" && (() => {
              const info = VACCINES_BRAZIL.find(v => v.name === vaccineForm.name);
              return info?.commonReactions.length ? (
                <div className="bg-muted/20 rounded-lg p-2">
                  <p className="text-[10px] font-heading font-semibold text-muted-foreground mb-1">Reações comuns conhecidas:</p>
                  <div className="flex flex-wrap gap-1">{info.commonReactions.map(r => <Badge key={r} variant="outline" className="text-[9px]">{r}</Badge>)}</div>
                </div>
              ) : null;
            })()}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">Cancelar</Button>
              <Button variant="secondary" onClick={handleAdd} className="flex-1">Registrar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VaccinesTab;
