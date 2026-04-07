import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { ClinicalRecord } from "@/contexts/ClinicalRecordContext";
import { format } from "date-fns";
import { calcGestationalAge, calcGestationalWeeks, getTrimesterFromIG, EXAMS_BY_TRIMESTER, VACCINES_BRAZIL, parseBloodPressure } from "./constants";
import AlertsPanel from "./AlertsPanel";
import GestationalCard from "./GestationalCard";
import ConsultationsTab from "./ConsultationsTab";
import ExamsTab from "./ExamsTab";
import VaccinesTab from "./VaccinesTab";
import TimelineTab from "./TimelineTab";
import CollapsibleSection from "./CollapsibleSection";

interface ClinicalRecordDetailProps {
  record: ClinicalRecord;
  onBack: () => void;
  onEdit: () => void;
  onRecordUpdate: (r: ClinicalRecord) => void;
}

const ClinicalRecordDetail = ({ record, onBack, onEdit, onRecordUpdate }: ClinicalRecordDetailProps) => {
  const gc = record.gestationalCard;
  const igAtual = calcGestationalAge(gc.dum);
  const igWeeks = calcGestationalWeeks(gc.dum);
  const currentTrimester = getTrimesterFromIG(igWeeks);

  const realizadas = record.prenatalConsultations.filter(c => c.status === "realizada").sort((a, b) => b.date.localeCompare(a.date));
  const lastConsult = realizadas[0];

  const alertCounts = useMemo(() => {
    let critical = 0, warning = 0;
    if (igWeeks >= 42) critical++;
    const recentBP = realizadas.slice(0, 3).filter(c => {
      const bp = parseBloodPressure(c.bloodPressure);
      return bp && (bp.systolic >= 140 || bp.diastolic >= 90);
    });
    if (recentBP.length >= 2) critical++;
    else if (recentBP.length === 1) warning++;
    if (realizadas[0]?.edema === "+++") critical++;
    const overdueConsults = record.prenatalConsultations.filter(c => c.status === "agendada" && new Date(c.date) < new Date());
    if (overdueConsults.length > 0) warning++;
    const expectedExams = EXAMS_BY_TRIMESTER[currentTrimester] || [];
    const doneExamTypes = record.gestationalExams.map(e => e.type);
    const pendingExams = expectedExams.filter(e => !doneExamTypes.includes(e));
    if (pendingExams.length > 0) warning++;
    const pendingVaccines = VACCINES_BRAZIL.filter(v => v.category === "recomendada").filter(v => !(record.vaccines || []).map(vv => vv.name).includes(v.name));
    if (pendingVaccines.length > 0) warning++;
    return { critical, warning, total: critical + warning };
  }, [record, igWeeks, currentTrimester, realizadas]);

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={onBack} className="rounded-full font-heading">← Voltar</Button>
        <Button variant="outline" onClick={onEdit} className="rounded-full font-heading">Editar</Button>
      </div>

      {/* Dashboard Header */}
      <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border shrink-0 overflow-hidden">
                {record.patientPhoto ? (
                  <img src={record.patientPhoto} alt="" className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <span className="text-lg text-muted-foreground font-heading font-bold">{record.fullName.charAt(0)}</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-heading font-bold text-xl text-foreground">{record.fullName}</h2>
                  {alertCounts.total > 0 && (
                    <Badge variant={alertCounts.critical > 0 ? "destructive" : "secondary"} className={`text-[10px] font-heading ${alertCounts.critical > 0 ? "clinical-alert-critical" : ""}`}>
                      {alertCounts.critical > 0 ? `${alertCounts.critical} crítico(s)` : ""} {alertCounts.warning > 0 ? `${alertCounts.warning} atenção` : ""}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{record.prontuarioNumber} {record.cpf ? `• CPF: ${record.cpf}` : ""}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Badge variant={record.status === "ativo" ? "default" : "secondary"} className="font-heading text-xs">{record.status}</Badge>
                  {gc.riskClassification === "alto_risco" && <Badge variant="destructive" className="font-heading text-xs">Alto Risco</Badge>}
                  {gc.bloodType && <Badge variant="outline" className="font-heading text-xs">{gc.bloodType}{gc.rh}</Badge>}
                  {gc.gravida && <Badge variant="outline" className="font-heading text-xs">G{gc.gravida}P{gc.para}A{gc.abortions}</Badge>}
                </div>
              </div>
            </div>

            <div className="flex gap-3 shrink-0">
              {gc.dum && (
                <div className="bg-white/30 backdrop-blur-lg rounded-xl px-4 py-2 text-center min-w-[80px] border border-white/40">
                  <p className="text-[9px] text-muted-foreground font-heading uppercase">IG</p>
                  <p className="text-lg font-heading font-bold text-secondary">{igAtual}</p>
                  <p className="text-[9px] text-muted-foreground">{currentTrimester}º tri</p>
                </div>
              )}
              {lastConsult && (
                <>
                  {lastConsult.bloodPressure && (
                    <div className={`rounded-xl px-3 py-2 text-center min-w-[70px] border border-white/40 ${parseBloodPressure(lastConsult.bloodPressure) && ((parseBloodPressure(lastConsult.bloodPressure))!.systolic >= 140 || (parseBloodPressure(lastConsult.bloodPressure))!.diastolic >= 90) ? "bg-destructive/10" : "bg-white/30 backdrop-blur-lg"}`}>
                      <p className="text-[9px] text-muted-foreground font-heading uppercase">PA</p>
                      <p className="text-sm font-heading font-bold text-foreground">{lastConsult.bloodPressure}</p>
                    </div>
                  )}
                  {lastConsult.weight && (
                    <div className="bg-white/30 backdrop-blur-lg rounded-xl px-3 py-2 text-center min-w-[60px] border border-white/40">
                      <p className="text-[9px] text-muted-foreground font-heading uppercase">Peso</p>
                      <p className="text-sm font-heading font-bold text-foreground">{lastConsult.weight}kg</p>
                    </div>
                  )}
                  {lastConsult.fetalHeartRate && (
                    <div className="bg-white/30 backdrop-blur-lg rounded-xl px-3 py-2 text-center min-w-[60px] border border-white/40">
                      <p className="text-[9px] text-muted-foreground font-heading uppercase">BCF</p>
                      <p className="text-sm font-heading font-bold text-foreground">{lastConsult.fetalHeartRate}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      <AlertsPanel record={record} onNavigateTab={() => {}} />

      {/* Collapsible Cards */}
      <CollapsibleSection title="Cartão Gestacional" defaultOpen={true}>
        <GestationalCard record={record} />
      </CollapsibleSection>

      <CollapsibleSection title="Dados Pessoais" defaultOpen={false}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "CPF", value: record.cpf || "—" },
            { label: "Nascimento", value: record.birthDate ? format(new Date(record.birthDate), "dd/MM/yyyy") : "—" },
            { label: "Telefone", value: record.phone || "—" },
            { label: "Estado Civil", value: record.maritalStatus || "—" },
            { label: "Profissão", value: record.profession || "—" },
            { label: "Endereço", value: record.address || "—" },
            { label: "Emergência", value: record.emergencyContact || "—" },
            { label: "Consentimento", value: record.consentSigned ? "Assinado" : "Pendente" },
          ].map(item => (
            <div key={item.label} className="bg-white/30 backdrop-blur-lg rounded-xl p-3 border border-white/40">
              <p className="text-[10px] text-muted-foreground font-heading uppercase">{item.label}</p>
              <p className="text-sm font-heading font-semibold text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Consultas Pré-Natal"
        count={record.prenatalConsultations.length}
        defaultOpen={true}
      >
        <ConsultationsTab record={record} onRecordUpdate={onRecordUpdate} />
      </CollapsibleSection>

      <CollapsibleSection
        title="Exames"
        count={record.gestationalExams.length}
        defaultOpen={false}
      >
        <ExamsTab record={record} onRecordUpdate={onRecordUpdate} />
      </CollapsibleSection>

      <CollapsibleSection
        title="Vacinas"
        count={(record.vaccines || []).length}
        defaultOpen={false}
      >
        <VaccinesTab record={record} onRecordUpdate={onRecordUpdate} />
      </CollapsibleSection>

      <CollapsibleSection title="Timeline" defaultOpen={false}>
        <TimelineTab record={record} />
      </CollapsibleSection>
    </div>
  );
};

export default ClinicalRecordDetail;
