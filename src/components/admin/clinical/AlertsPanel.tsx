import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ClinicalRecord } from "@/contexts/ClinicalRecordContext";
import { calcGestationalWeeks, getTrimesterFromIG, EXAMS_BY_TRIMESTER, VACCINES_BRAZIL, parseBloodPressure } from "./constants";

type AlertSeverity = "critical" | "warning" | "info" | "positive";

interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  action?: { label: string; tab?: string };
}

interface AlertsPanelProps {
  record: ClinicalRecord;
  onNavigateTab?: (tab: string) => void;
}

const AlertsPanel = ({ record, onNavigateTab }: AlertsPanelProps) => {
  const alerts = useMemo(() => {
    const result: Alert[] = [];
    const gc = record.gestationalCard;
    const igWeeks = calcGestationalWeeks(gc.dum);
    if (!gc.dum || igWeeks <= 0) return result;

    const currentTrimester = getTrimesterFromIG(igWeeks);

    // === CRITICAL ALERTS ===

    if (igWeeks >= 42) {
      result.push({ id: "post-term", severity: "critical", title: "POS-TERMO — IG >= 42 semanas", description: "Gestacao alem do termo. Encaminhamento urgente para inducao/avaliacao.", action: { label: "Ver Cartao", tab: "cartao" } });
    }

    const realizadas = record.prenatalConsultations.filter(c => c.status === "realizada").sort((a, b) => b.date.localeCompare(a.date));
    const recentWithBP = realizadas.slice(0, 3);
    const hypertensiveReadings = recentWithBP.filter(c => {
      const bp = parseBloodPressure(c.bloodPressure);
      return bp && (bp.systolic >= 140 || bp.diastolic >= 90);
    });

    if (hypertensiveReadings.length >= 2) {
      result.push({ id: "bp-consecutive", severity: "critical", title: "PA elevada em 2+ consultas consecutivas", description: `HAS gestacional — investigar pre-eclampsia urgente. Ultimas: ${hypertensiveReadings.map(c => c.bloodPressure).join(", ")}`, action: { label: "Ver Consultas", tab: "consultas" } });
    } else if (hypertensiveReadings.length === 1) {
      result.push({ id: "bp-single", severity: "warning", title: "PA elevada na ultima consulta", description: `PA ${hypertensiveReadings[0].bloodPressure} — monitorar na proxima consulta`, action: { label: "Ver Consultas", tab: "consultas" } });
    }

    if (realizadas[0]?.edema === "+++") {
      result.push({ id: "edema-severe", severity: "critical", title: "Edema +++ detectado", description: "Edema severo — avaliar pre-eclampsia, funcao renal e hepatica" });
    }

    // No consultation in overdue period based on GA
    if (realizadas.length > 0) {
      const lastDate = new Date(realizadas[0].date);
      const daysSince = (Date.now() - lastDate.getTime()) / (24 * 60 * 60 * 1000);
      const maxDays = igWeeks >= 36 ? 10 : igWeeks >= 28 ? 21 : 35;
      if (daysSince > maxDays) {
        const intervalLabel = igWeeks >= 36 ? "semanal" : igWeeks >= 28 ? "quinzenal" : "mensal";
        result.push({ id: "no-consult-overdue", severity: "critical", title: `Sem consulta ha ${Math.floor(daysSince)} dias (intervalo ${intervalLabel})`, description: `Ultima consulta ha ${Math.floor(daysSince)} dias. Risco de perda de seguimento.`, action: { label: "Agendar", tab: "consultas" } });
      }
    } else if (igWeeks > 8) {
      result.push({ id: "no-consult-ever", severity: "critical", title: "Nenhuma consulta registrada", description: `Gestante com ${igWeeks} semanas sem consulta pre-natal.`, action: { label: "Agendar", tab: "consultas" } });
    }

    // Weight loss
    if (realizadas.length >= 2) {
      const curr = parseFloat(realizadas[0].weight);
      const prev = parseFloat(realizadas[1].weight);
      if (curr && prev) {
        const diffDays = (new Date(realizadas[0].date).getTime() - new Date(realizadas[1].date).getTime()) / (24 * 60 * 60 * 1000);
        const weeklyChange = diffDays > 0 ? ((curr - prev) / diffDays) * 7 : 0;
        if (weeklyChange < -1) {
          result.push({ id: "weight-loss", severity: "critical", title: "Perda de peso significativa", description: `${Math.abs(weeklyChange).toFixed(1)}kg/semana de perda. Investigar causa.` });
        } else if (weeklyChange > 0.5) {
          result.push({ id: "weight-gain", severity: "warning", title: "Ganho de peso acima do esperado", description: `${weeklyChange.toFixed(1)}kg/semana (recomendado < 0.5kg/sem)` });
        }
      }
    }

    // Age-based risk (if birth date available)
    if (record.birthDate) {
      const age = (Date.now() - new Date(record.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      if (age >= 35) {
        result.push({ id: "age-risk", severity: "warning", title: `Idade materna >= 35 anos (${Math.floor(age)})`, description: "Gestante de alto risco obstetrico por idade. Manter vigilancia." });
      }
      if (age < 18) {
        result.push({ id: "age-adolescent", severity: "warning", title: `Gestante adolescente (${Math.floor(age)} anos)`, description: "Acompanhamento especial recomendado." });
      }
    }

    // BMI risk
    if (gc.preGestationalBmi) {
      const bmi = parseFloat(gc.preGestationalBmi);
      if (bmi > 30) {
        result.push({ id: "bmi-obesity", severity: "warning", title: `Obesidade pre-gestacional (IMC ${bmi.toFixed(1)})`, description: "Monitorar ganho de peso e rastreio de diabetes." });
      } else if (bmi < 18.5) {
        result.push({ id: "bmi-low", severity: "warning", title: `Baixo peso pre-gestacional (IMC ${bmi.toFixed(1)})`, description: "Avaliar nutricao e ganho de peso adequado." });
      }
    }

    // === WARNING ALERTS ===

    const overdueConsults = record.prenatalConsultations.filter(c => c.status === "agendada" && new Date(c.date) < new Date());
    if (overdueConsults.length > 0) {
      result.push({ id: "consult-overdue", severity: "warning", title: `${overdueConsults.length} consulta(s) vencida(s)`, description: "Consultas agendadas passaram da data sem realizacao", action: { label: "Ver Consultas", tab: "consultas" } });
    }

    const expectedExams = EXAMS_BY_TRIMESTER[currentTrimester] || [];
    const doneExamTypes = record.gestationalExams.map(e => e.type);
    const pendingExams = expectedExams.filter(e => !doneExamTypes.includes(e));
    if (pendingExams.length > 0) {
      result.push({ id: "exams-pending", severity: "warning", title: `${pendingExams.length} exame(s) pendente(s) do ${currentTrimester} tri`, description: pendingExams.slice(0, 3).join(", ") + (pendingExams.length > 3 ? ` +${pendingExams.length - 3}` : ""), action: { label: "Solicitar", tab: "exames" } });
    }

    // Exams waiting for results
    const pendingResults = record.gestationalExams.filter(e => !e.result);
    if (pendingResults.length > 0) {
      result.push({ id: "exams-no-result", severity: "warning", title: `${pendingResults.length} exame(s) aguardando resultado`, description: pendingResults.slice(0, 3).map(e => e.type).join(", "), action: { label: "Registrar Resultado", tab: "exames" } });
    }

    // Altered exams
    const alteredExams = record.gestationalExams.filter(e => e.interpretation === "alterado");
    if (alteredExams.length > 0) {
      result.push({ id: "exams-altered", severity: "warning", title: `${alteredExams.length} exame(s) com resultado alterado`, description: alteredExams.map(e => e.type).join(", "), action: { label: "Ver Exames", tab: "exames" } });
    }

    const recommendedVaccines = VACCINES_BRAZIL.filter(v => v.category === "recomendada");
    const appliedNames = (record.vaccines || []).map(v => v.name);
    const pendingVaccines = recommendedVaccines.filter(v => !appliedNames.includes(v.name));
    if (pendingVaccines.length > 0) {
      result.push({ id: "vaccines-pending", severity: "warning", title: `${pendingVaccines.length} vacina(s) recomendada(s) pendente(s)`, description: pendingVaccines.map(v => v.name).slice(0, 3).join(", "), action: { label: "Ver Vacinas", tab: "vacinas" } });
    }

    // === UPCOMING MILESTONES ===

    const milestones = [
      { minWeek: 11, maxWeek: 14, exam: "Ultrassom 1 Trimestre", label: "Translucencia Nucal — janela ideal (11-14s)" },
      { minWeek: 18, maxWeek: 24, exam: "Ultrassom Morfologico", label: "Ultrassom Morfologico — janela ideal (20-24s)" },
      { minWeek: 24, maxWeek: 28, exam: "TOTG 75g", label: "TOTG 75g — periodo recomendado (24-28s)" },
      { minWeek: 35, maxWeek: 37, exam: "Estreptococo Grupo B (GBS)", label: "Cultura GBS — periodo recomendado (35-37s)" },
    ];

    milestones.forEach(m => {
      if (igWeeks >= m.minWeek && igWeeks <= m.maxWeek && !doneExamTypes.includes(m.exam)) {
        const weeksLeft = m.maxWeek - igWeeks;
        result.push({
          id: `milestone-${m.exam}`,
          severity: weeksLeft <= 1 ? "warning" : "info",
          title: m.label,
          description: weeksLeft <= 1 ? `Ultima semana da janela ideal! Solicitar urgente.` : `${weeksLeft} semanas restantes na janela ideal.`,
          action: { label: "Solicitar", tab: "exames" },
        });
      }
    });

    // dTpa window
    if (igWeeks >= 20 && igWeeks <= 36 && !appliedNames.includes("dTpa (Triplice Bacteriana)")) {
      result.push({ id: "dtpa-window", severity: "info", title: "dTpa — janela ideal (20-36s)", description: "Vacina contra coqueluche — protege o recem-nascido", action: { label: "Vacinar", tab: "vacinas" } });
    }

    // Term milestone
    if (igWeeks >= 36 && igWeeks < 37) {
      result.push({ id: "near-term", severity: "info", title: "Gestacao proxima ao termo (36s)", description: "Preparar para o parto. Revisar plano de parto e documentacao." });
    }
    if (igWeeks >= 37 && igWeeks < 42) {
      result.push({ id: "at-term", severity: "info", title: "Gestacao a termo", description: `IG ${igWeeks} semanas. Manter consultas semanais ate o parto.` });
    }

    // === POSITIVE ALERTS ===

    const allCurrentExamsDone = pendingExams.length === 0;
    const allVaccinesDone = pendingVaccines.length === 0;
    const consultasEmDia = overdueConsults.length === 0 && realizadas.length > 0;

    if (allCurrentExamsDone && allVaccinesDone && consultasEmDia && hypertensiveReadings.length === 0) {
      result.push({ id: "all-good", severity: "positive", title: "Gestacao em acompanhamento adequado!", description: "Exames, vacinas e consultas em dia." });
    } else {
      if (allCurrentExamsDone) {
        result.push({ id: "exams-ok", severity: "positive", title: `Exames do ${currentTrimester} trimestre em dia`, description: "Todos os exames recomendados foram realizados" });
      }
      if (allVaccinesDone) {
        result.push({ id: "vaccines-ok", severity: "positive", title: "Vacinas recomendadas em dia", description: "Todas as vacinas do calendario gestacional foram aplicadas" });
      }
    }

    const order: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2, positive: 3 };
    return result.sort((a, b) => order[a.severity] - order[b.severity]);
  }, [record]);

  if (alerts.length === 0) return null;

  const styleMap: Record<AlertSeverity, string> = {
    critical: "bg-red-50 border-red-200 text-foreground",
    warning: "bg-amber-50 border-amber-200 text-foreground",
    info: "bg-blue-50 border-blue-200 text-foreground",
    positive: "bg-green-50 border-green-200 text-foreground",
  };

  const badgeMap: Record<AlertSeverity, { label: string; variant: "destructive" | "secondary" | "outline" | "default" }> = {
    critical: { label: "Critico", variant: "destructive" },
    warning: { label: "Atencao", variant: "secondary" },
    info: { label: "Info", variant: "outline" },
    positive: { label: "OK", variant: "default" },
  };

  const criticalCount = alerts.filter(a => a.severity === "critical").length;
  const warningCount = alerts.filter(a => a.severity === "warning").length;

  return (
    <Card className="clinical-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-heading font-bold text-foreground">Alertas e Pendencias</p>
          <div className="flex gap-1.5">
            {criticalCount > 0 && <Badge variant="destructive" className="text-[9px] font-heading clinical-alert-critical">{criticalCount} critico(s)</Badge>}
            {warningCount > 0 && <Badge variant="secondary" className="text-[9px] font-heading">{warningCount} atencao</Badge>}
          </div>
        </div>
        <div className="space-y-2">
          {alerts.map((a) => (
            <div key={a.id} className={`flex items-start gap-3 rounded-xl border p-3 transition-all ${styleMap[a.severity]} ${a.severity === "critical" ? "clinical-alert-critical" : ""}`}>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-heading font-bold">{a.title}</p>
                <p className="text-[11px] opacity-80">{a.description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {a.action && onNavigateTab && (
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 font-heading" onClick={() => onNavigateTab(a.action!.tab || "cartao")}>
                    {a.action.label}
                  </Button>
                )}
                <Badge variant={badgeMap[a.severity].variant} className="text-[9px] font-heading">
                  {badgeMap[a.severity].label}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AlertsPanel;