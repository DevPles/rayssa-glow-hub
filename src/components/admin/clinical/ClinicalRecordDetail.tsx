import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ClinicalRecord, PrenatalConsultation, GestationalExam } from "@/contexts/ClinicalRecordContext";
import { format } from "date-fns";
import { calcGestationalAge, calcGestationalWeeks, getTrimesterFromIG, EXAMS_BY_TRIMESTER, VACCINES_BRAZIL, parseBloodPressure, suggestNextAppointment } from "./constants";
import AlertsPanel from "./AlertsPanel";
import GestationalCard from "./GestationalCard";
import ConsultationsTab from "./ConsultationsTab";
import ExamsTab from "./ExamsTab";
import VaccinesTab from "./VaccinesTab";
import TimelineTab from "./TimelineTab";

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

  const [activeTab, setActiveTab] = useState("cartao");

  // Quick stats from latest consultation
  const realizadas = record.prenatalConsultations.filter(c => c.status === "realizada").sort((a, b) => b.date.localeCompare(a.date));
  const lastConsult = realizadas[0];

  // Alert counts for header badge
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

  // Context-aware quick actions
  const quickActions = useMemo(() => {
    const actions: { label: string; icon: string; tab: string }[] = [];
    const doneExamTypes = record.gestationalExams.map(e => e.type);

    if (igWeeks >= 11 && igWeeks <= 14 && !doneExamTypes.includes("Ultrassom 1º Trimestre")) {
      actions.push({ label: "Solicitar NT", icon: "📸", tab: "exames" });
    }
    if (igWeeks >= 20 && igWeeks <= 24 && !doneExamTypes.includes("Ultrassom Morfológico")) {
      actions.push({ label: "Solicitar Morfo", icon: "📸", tab: "exames" });
    }
    if (igWeeks >= 24 && igWeeks <= 28 && !doneExamTypes.includes("TOTG 75g")) {
      actions.push({ label: "Solicitar TOTG", icon: "🧪", tab: "exames" });
    }
    if (igWeeks >= 35 && igWeeks <= 37 && !doneExamTypes.includes("Estreptococo Grupo B (GBS)")) {
      actions.push({ label: "Solicitar GBS", icon: "🦠", tab: "exames" });
    }

    const overdueConsults = record.prenatalConsultations.filter(c => c.status === "agendada" && new Date(c.date) < new Date());
    if (overdueConsults.length > 0) {
      actions.push({ label: "Reagendar", icon: "📅", tab: "consultas" });
    }

    return actions.slice(0, 4);
  }, [record, igWeeks]);

  const handleConsultClick = () => setActiveTab("consultas");
  const handleExamClick = () => setActiveTab("exames");

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={onBack}>← Voltar</Button>
        <div className="flex gap-2">
          {quickActions.map(qa => (
            <Button key={qa.label} variant="outline" size="sm" className="text-[10px] font-heading h-7" onClick={() => setActiveTab(qa.tab)}>
              {qa.icon} {qa.label}
            </Button>
          ))}
          <Button variant="outline" onClick={onEdit}>Editar</Button>
        </div>
      </div>

      {/* Dashboard Header */}
      <Card className="clinical-card">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            {/* Patient info */}
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
                      {alertCounts.critical > 0 ? `🔴 ${alertCounts.critical}` : ""} {alertCounts.warning > 0 ? `🟡 ${alertCounts.warning}` : ""}
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

            {/* Quick stats cards */}
            <div className="flex gap-3 shrink-0">
              {gc.dum && (
                <div className="bg-secondary/10 rounded-xl px-4 py-2 text-center min-w-[80px]">
                  <p className="text-[9px] text-muted-foreground font-heading uppercase">IG</p>
                  <p className="text-lg font-heading font-bold text-secondary">{igAtual}</p>
                  <p className="text-[9px] text-muted-foreground">{currentTrimester}º tri</p>
                </div>
              )}
              {lastConsult && (
                <>
                  {lastConsult.bloodPressure && (
                    <div className={`rounded-xl px-3 py-2 text-center min-w-[70px] ${parseBloodPressure(lastConsult.bloodPressure) && ((parseBloodPressure(lastConsult.bloodPressure))!.systolic >= 140 || (parseBloodPressure(lastConsult.bloodPressure))!.diastolic >= 90) ? "bg-red-100 dark:bg-red-950/30" : "bg-muted/30"}`}>
                      <p className="text-[9px] text-muted-foreground font-heading uppercase">PA</p>
                      <p className="text-sm font-heading font-bold text-foreground">{lastConsult.bloodPressure}</p>
                    </div>
                  )}
                  {lastConsult.weight && (
                    <div className="bg-muted/30 rounded-xl px-3 py-2 text-center min-w-[60px]">
                      <p className="text-[9px] text-muted-foreground font-heading uppercase">Peso</p>
                      <p className="text-sm font-heading font-bold text-foreground">{lastConsult.weight}kg</p>
                    </div>
                  )}
                  {lastConsult.fetalHeartRate && (
                    <div className="bg-muted/30 rounded-xl px-3 py-2 text-center min-w-[60px]">
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
      <AlertsPanel record={record} onNavigateTab={setActiveTab} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-6 bg-white/40 backdrop-blur-xl rounded-xl">
          <TabsTrigger value="cartao" className="rounded-lg font-heading text-xs">Cartão</TabsTrigger>
          <TabsTrigger value="timeline" className="rounded-lg font-heading text-xs">Timeline</TabsTrigger>
          <TabsTrigger value="consultas" className="rounded-lg font-heading text-xs">Consultas ({record.prenatalConsultations.length})</TabsTrigger>
          <TabsTrigger value="exames" className="rounded-lg font-heading text-xs">Exames ({record.gestationalExams.length})</TabsTrigger>
          <TabsTrigger value="vacinas" className="rounded-lg font-heading text-xs">Vacinas ({(record.vaccines || []).length})</TabsTrigger>
          <TabsTrigger value="dados" className="rounded-lg font-heading text-xs">Dados</TabsTrigger>
        </TabsList>

        <TabsContent value="cartao" className="mt-4">
          <GestationalCard record={record} />
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <TimelineTab record={record} onConsultClick={handleConsultClick} onExamClick={handleExamClick} />
        </TabsContent>

        <TabsContent value="consultas" className="mt-4">
          <ConsultationsTab record={record} onRecordUpdate={onRecordUpdate} />
        </TabsContent>

        <TabsContent value="exames" className="mt-4">
          <ExamsTab record={record} onRecordUpdate={onRecordUpdate} />
        </TabsContent>

        <TabsContent value="vacinas" className="mt-4">
          <VaccinesTab record={record} onRecordUpdate={onRecordUpdate} />
        </TabsContent>

        <TabsContent value="dados" className="mt-4">
          <Card className="clinical-card">
            <CardContent className="p-4">
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
    </div>
  );
};

export default ClinicalRecordDetail;
