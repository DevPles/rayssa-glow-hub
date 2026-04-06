import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { ClinicalRecord } from "@/contexts/ClinicalRecordContext";
import { calcGestationalWeeks, getTrimesterFromIG, EXAMS_BY_TRIMESTER, VACCINES_BRAZIL, parseBloodPressure } from "./constants";

interface Alert {
  id: string;
  type: "danger" | "warning" | "info";
  icon: string;
  title: string;
  description: string;
}

interface AlertsPanelProps {
  record: ClinicalRecord;
}

const AlertsPanel = ({ record }: AlertsPanelProps) => {
  const alerts = useMemo(() => {
    const result: Alert[] = [];
    const gc = record.gestationalCard;
    const igWeeks = calcGestationalWeeks(gc.dum);
    if (!gc.dum || igWeeks <= 0) return result;

    const currentTrimester = getTrimesterFromIG(igWeeks);

    // 1. Exames atrasados
    const expectedExams = EXAMS_BY_TRIMESTER[currentTrimester] || [];
    const doneExamTypes = record.gestationalExams.map(e => e.type);
    const pendingExams = expectedExams.filter(e => !doneExamTypes.includes(e));
    if (pendingExams.length > 0) {
      result.push({
        id: "exams-pending",
        type: "warning",
        icon: "🔬",
        title: `${pendingExams.length} exame(s) pendente(s) do ${currentTrimester}º trimestre`,
        description: pendingExams.slice(0, 3).join(", ") + (pendingExams.length > 3 ? ` e mais ${pendingExams.length - 3}` : ""),
      });
    }

    // 2. Vacinas pendentes (recomendadas)
    const recommendedVaccines = VACCINES_BRAZIL.filter(v => v.category === "recomendada");
    const appliedNames = (record.vaccines || []).map(v => v.name);
    const pendingVaccines = recommendedVaccines.filter(v => !appliedNames.includes(v.name));
    if (pendingVaccines.length > 0) {
      result.push({
        id: "vaccines-pending",
        type: "info",
        icon: "💉",
        title: `${pendingVaccines.length} vacina(s) recomendada(s) pendente(s)`,
        description: pendingVaccines.map(v => v.name).join(", "),
      });
    }

    // 3. Consultas vencidas
    const overdueConsults = record.prenatalConsultations.filter(c => c.status === "agendada" && new Date(c.date) < new Date());
    if (overdueConsults.length > 0) {
      result.push({
        id: "consult-overdue",
        type: "danger",
        icon: "📅",
        title: `${overdueConsults.length} consulta(s) agendada(s) vencida(s)`,
        description: "Consultas passaram da data sem realização",
      });
    }

    // 4. PA elevada na última consulta
    const realizadas = record.prenatalConsultations.filter(c => c.status === "realizada").sort((a, b) => b.date.localeCompare(a.date));
    if (realizadas.length > 0) {
      const last = realizadas[0];
      const bp = parseBloodPressure(last.bloodPressure);
      if (bp && (bp.systolic >= 140 || bp.diastolic >= 90)) {
        result.push({
          id: "bp-high",
          type: "danger",
          icon: "🩺",
          title: "PA elevada na última consulta",
          description: `PA ${last.bloodPressure} — investigar pré-eclâmpsia`,
        });
      }

      // 5. Ganho de peso excessivo
      if (realizadas.length >= 2) {
        const curr = parseFloat(realizadas[0].weight);
        const prev = parseFloat(realizadas[1].weight);
        if (curr && prev) {
          const diffDays = (new Date(realizadas[0].date).getTime() - new Date(realizadas[1].date).getTime()) / (24 * 60 * 60 * 1000);
          const weeklyGain = diffDays > 0 ? ((curr - prev) / diffDays) * 7 : 0;
          if (weeklyGain > 0.5) {
            result.push({
              id: "weight-gain",
              type: "warning",
              icon: "⚖️",
              title: "Ganho de peso acima do esperado",
              description: `${weeklyGain.toFixed(1)}kg/semana (recomendado < 0.5kg/sem)`,
            });
          }
        }
      }

      // Edema +++
      if (last.edema === "+++") {
        result.push({
          id: "edema-severe",
          type: "danger",
          icon: "🦶",
          title: "Edema +++ na última consulta",
          description: "Edema severo — avaliar pré-eclâmpsia e função renal",
        });
      }
    }

    // 6. Marcos próximos
    if (igWeeks >= 18 && igWeeks <= 24 && !doneExamTypes.includes("Ultrassom Morfológico")) {
      result.push({
        id: "morpho-due",
        type: "info",
        icon: "📸",
        title: "Ultrassom Morfológico — janela ideal",
        description: "Realizar entre 20ª e 24ª semana",
      });
    }
    if (igWeeks >= 24 && igWeeks <= 28 && !doneExamTypes.includes("TOTG 75g")) {
      result.push({
        id: "totg-due",
        type: "info",
        icon: "🧪",
        title: "TOTG 75g — período recomendado",
        description: "Realizar entre 24ª e 28ª semana para rastreio de DMG",
      });
    }
    if (igWeeks >= 35 && igWeeks <= 37 && !doneExamTypes.includes("Estreptococo Grupo B (GBS)")) {
      result.push({
        id: "gbs-due",
        type: "warning",
        icon: "🦠",
        title: "Cultura GBS — período recomendado",
        description: "Realizar entre 35ª e 37ª semana",
      });
    }

    return result;
  }, [record]);

  if (alerts.length === 0) return null;

  const colorMap = { danger: "bg-destructive/10 border-destructive/30 text-destructive", warning: "bg-amber-50 border-amber-200 text-amber-800", info: "bg-blue-50 border-blue-200 text-blue-800" };

  return (
    <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg">
      <CardContent className="p-4">
        <p className="text-xs font-heading font-bold text-foreground mb-3">🚨 Alertas e Pendências ({alerts.length})</p>
        <div className="space-y-2">
          {alerts.map((a) => (
            <div key={a.id} className={`flex items-start gap-3 rounded-xl border p-3 ${colorMap[a.type]}`}>
              <span className="text-lg shrink-0">{a.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-heading font-bold">{a.title}</p>
                <p className="text-[11px] opacity-80">{a.description}</p>
              </div>
              <Badge variant={a.type === "danger" ? "destructive" : a.type === "warning" ? "secondary" : "outline"} className="text-[9px] font-heading shrink-0">
                {a.type === "danger" ? "Urgente" : a.type === "warning" ? "Atenção" : "Info"}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AlertsPanel;
