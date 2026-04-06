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
  icon: string;
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

    // Post-term
    if (igWeeks >= 42) {
      result.push({ id: "post-term", severity: "critical", icon: "🚨", title: "PÓS-TERMO — IG ≥ 42 semanas", description: "Gestação além do termo. Encaminhamento urgente para indução/avaliação.", action: { label: "Ver Cartão", tab: "cartao" } });
    }

    // Consecutive high BP (2+ readings)
    const realizadas = record.prenatalConsultations.filter(c => c.status === "realizada").sort((a, b) => b.date.localeCompare(a.date));
    const recentWithBP = realizadas.slice(0, 3);
    const hypertensiveReadings = recentWithBP.filter(c => {
      const bp = parseBloodPressure(c.bloodPressure);
      return bp && (bp.systolic >= 140 || bp.diastolic >= 90);
    });

    if (hypertensiveReadings.length >= 2) {
      result.push({ id: "bp-consecutive", severity: "critical", icon: "🩺", title: "PA elevada em 2+ consultas consecutivas", description: `HAS gestacional — investigar pré-eclâmpsia urgente. Últimas: ${hypertensiveReadings.map(c => c.bloodPressure).join(", ")}`, action: { label: "Ver Consultas", tab: "consultas" } });
    } else if (hypertensiveReadings.length === 1) {
      result.push({ id: "bp-single", severity: "warning", icon: "🩺", title: "PA elevada na última consulta", description: `PA ${hypertensiveReadings[0].bloodPressure} — monitorar na próxima consulta`, action: { label: "Ver Consultas", tab: "consultas" } });
    }

    // Severe edema
    if (realizadas[0]?.edema === "+++") {
      result.push({ id: "edema-severe", severity: "critical", icon: "🦶", title: "Edema +++ detectado", description: "Edema severo — avaliar pré-eclâmpsia, função renal e hepática" });
    }

    // No consultation in 30+ days in 3rd trimester
    if (igWeeks >= 28 && realizadas.length > 0) {
      const lastDate = new Date(realizadas[0].date);
      const daysSince = (Date.now() - lastDate.getTime()) / (24 * 60 * 60 * 1000);
      if (daysSince > 30) {
        result.push({ id: "no-consult-30d", severity: "critical", icon: "📅", title: "Sem consulta há mais de 30 dias (3º tri)", description: `Última consulta há ${Math.floor(daysSince)} dias. Risco de perda de seguimento.`, action: { label: "Agendar", tab: "consultas" } });
      }
    }

    // Weight loss >1kg/week
    if (realizadas.length >= 2) {
      const curr = parseFloat(realizadas[0].weight);
      const prev = parseFloat(realizadas[1].weight);
      if (curr && prev) {
        const diffDays = (new Date(realizadas[0].date).getTime() - new Date(realizadas[1].date).getTime()) / (24 * 60 * 60 * 1000);
        const weeklyChange = diffDays > 0 ? ((curr - prev) / diffDays) * 7 : 0;
        if (weeklyChange < -1) {
          result.push({ id: "weight-loss", severity: "critical", icon: "⚖️", title: "Perda de peso significativa", description: `${Math.abs(weeklyChange).toFixed(1)}kg/semana de perda. Investigar causa.` });
        } else if (weeklyChange > 0.5) {
          result.push({ id: "weight-gain", severity: "warning", icon: "⚖️", title: "Ganho de peso acima do esperado", description: `${weeklyChange.toFixed(1)}kg/semana (recomendado < 0.5kg/sem)` });
        }
      }
    }

    // === WARNING ALERTS ===

    // Overdue consultations
    const overdueConsults = record.prenatalConsultations.filter(c => c.status === "agendada" && new Date(c.date) < new Date());
    if (overdueConsults.length > 0) {
      result.push({ id: "consult-overdue", severity: "warning", icon: "📅", title: `${overdueConsults.length} consulta(s) vencida(s)`, description: "Consultas agendadas passaram da data sem realização", action: { label: "Ver Consultas", tab: "consultas" } });
    }

    // Pending exams for current trimester
    const expectedExams = EXAMS_BY_TRIMESTER[currentTrimester] || [];
    const doneExamTypes = record.gestationalExams.map(e => e.type);
    const pendingExams = expectedExams.filter(e => !doneExamTypes.includes(e));
    if (pendingExams.length > 0) {
      result.push({ id: "exams-pending", severity: "warning", icon: "🔬", title: `${pendingExams.length} exame(s) pendente(s) do ${currentTrimester}º tri`, description: pendingExams.slice(0, 3).join(", ") + (pendingExams.length > 3 ? ` +${pendingExams.length - 3}` : ""), action: { label: "Solicitar", tab: "exames" } });
    }

    // Pending recommended vaccines
    const recommendedVaccines = VACCINES_BRAZIL.filter(v => v.category === "recomendada");
    const appliedNames = (record.vaccines || []).map(v => v.name);
    const pendingVaccines = recommendedVaccines.filter(v => !appliedNames.includes(v.name));
    if (pendingVaccines.length > 0) {
      result.push({ id: "vaccines-pending", severity: "warning", icon: "💉", title: `${pendingVaccines.length} vacina(s) recomendada(s) pendente(s)`, description: pendingVaccines.map(v => v.name).slice(0, 3).join(", "), action: { label: "Ver Vacinas", tab: "vacinas" } });
    }

    // === INFO ALERTS (contextual milestones) ===

    if (igWeeks >= 11 && igWeeks <= 14 && !doneExamTypes.includes("Ultrassom 1º Trimestre")) {
      result.push({ id: "nt-window", severity: "info", icon: "📸", title: "Translucência Nucal — janela ideal (11-14s)", description: "Solicitar ultrassom de 1º trimestre com TN", action: { label: "Solicitar", tab: "exames" } });
    }
    if (igWeeks >= 18 && igWeeks <= 24 && !doneExamTypes.includes("Ultrassom Morfológico")) {
      result.push({ id: "morpho-due", severity: "info", icon: "📸", title: "Ultrassom Morfológico — janela ideal (20-24s)", description: "Realizar entre 20ª e 24ª semana", action: { label: "Solicitar", tab: "exames" } });
    }
    if (igWeeks >= 24 && igWeeks <= 28 && !doneExamTypes.includes("TOTG 75g")) {
      result.push({ id: "totg-due", severity: "info", icon: "🧪", title: "TOTG 75g — período recomendado (24-28s)", description: "Rastreio de diabetes mellitus gestacional", action: { label: "Solicitar", tab: "exames" } });
    }
    if (igWeeks >= 35 && igWeeks <= 37 && !doneExamTypes.includes("Estreptococo Grupo B (GBS)")) {
      result.push({ id: "gbs-due", severity: "info", icon: "🦠", title: "Cultura GBS — período recomendado (35-37s)", description: "Streptococcus do grupo B", action: { label: "Solicitar", tab: "exames" } });
    }

    // dTpa window
    if (igWeeks >= 20 && igWeeks <= 36 && !appliedNames.includes("dTpa (Tríplice Bacteriana)")) {
      result.push({ id: "dtpa-window", severity: "info", icon: "💉", title: "dTpa — janela ideal (20-36s)", description: "Vacina contra coqueluche — protege o recém-nascido", action: { label: "Vacinar", tab: "vacinas" } });
    }

    // === POSITIVE ALERTS ===

    const allCurrentExamsDone = pendingExams.length === 0;
    const allVaccinesDone = pendingVaccines.length === 0;
    const consultasEmDia = overdueConsults.length === 0 && realizadas.length > 0;

    if (allCurrentExamsDone && allVaccinesDone && consultasEmDia && hypertensiveReadings.length === 0) {
      result.push({ id: "all-good", severity: "positive", icon: "🌟", title: "Gestação em acompanhamento adequado!", description: "Exames, vacinas e consultas em dia. Parabéns!" });
    } else {
      if (allCurrentExamsDone) {
        result.push({ id: "exams-ok", severity: "positive", icon: "✅", title: `Exames do ${currentTrimester}º trimestre em dia`, description: "Todos os exames recomendados foram realizados" });
      }
      if (allVaccinesDone) {
        result.push({ id: "vaccines-ok", severity: "positive", icon: "✅", title: "Vacinas recomendadas em dia", description: "Todas as vacinas do calendário gestacional foram aplicadas" });
      }
    }

    // Sort: critical first, then warning, info, positive
    const order: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2, positive: 3 };
    return result.sort((a, b) => order[a.severity] - order[b.severity]);
  }, [record]);

  if (alerts.length === 0) return null;

  const styleMap: Record<AlertSeverity, string> = {
    critical: "bg-red-50 border-red-300 text-red-900 dark:bg-red-950/30 dark:border-red-800 dark:text-red-200",
    warning: "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200",
    info: "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-200",
    positive: "bg-green-50 border-green-200 text-green-900 dark:bg-green-950/30 dark:border-green-800 dark:text-green-200",
  };

  const badgeMap: Record<AlertSeverity, { label: string; variant: "destructive" | "secondary" | "outline" | "default" }> = {
    critical: { label: "Crítico", variant: "destructive" },
    warning: { label: "Atenção", variant: "secondary" },
    info: { label: "Info", variant: "outline" },
    positive: { label: "OK", variant: "default" },
  };

  const criticalCount = alerts.filter(a => a.severity === "critical").length;
  const warningCount = alerts.filter(a => a.severity === "warning").length;

  return (
    <Card className="clinical-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-heading font-bold text-foreground">
            🚨 Painel de Inteligência Clínica
          </p>
          <div className="flex gap-1.5">
            {criticalCount > 0 && <Badge variant="destructive" className="text-[9px] font-heading clinical-alert-critical">{criticalCount} crítico(s)</Badge>}
            {warningCount > 0 && <Badge variant="secondary" className="text-[9px] font-heading">{warningCount} atenção</Badge>}
          </div>
        </div>
        <div className="space-y-2">
          {alerts.map((a) => (
            <div key={a.id} className={`flex items-start gap-3 rounded-xl border p-3 transition-all ${styleMap[a.severity]} ${a.severity === "critical" ? "clinical-alert-critical" : ""}`}>
              <span className="text-lg shrink-0">{a.icon}</span>
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
