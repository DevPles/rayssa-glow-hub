import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ClinicalRecord } from "@/contexts/ClinicalRecordContext";
import { format } from "date-fns";
import { calcGestationalAge, calcGestationalWeeks, calcIMC, EXAMS_BY_TRIMESTER, VACCINES_BRAZIL } from "./constants";
import FilterableChart from "./FilterableChart";

interface GestationalCardProps {
  record: ClinicalRecord;
}

const GestationalCard = ({ record }: GestationalCardProps) => {
  const gc = record.gestationalCard;
  const igAtual = calcGestationalAge(gc.dum);
  const igWeeks = calcGestationalWeeks(gc.dum);
  const totalWeeks = 42;
  const progressPct = igWeeks > 0 ? Math.min((igWeeks / totalWeeks) * 100, 100) : 0;

  const realizadas = record.prenatalConsultations.filter(c => c.status === "realizada").sort((a, b) => b.date.localeCompare(a.date));
  const lastConsult = realizadas[0];

  // Current gestational IMC
  const currentIMC = lastConsult?.weight ? calcIMC(lastConsult.weight, gc.height) : "";

  // Chart data
  const weightData = useMemo(() =>
    record.prenatalConsultations
      .filter(c => c.weight && c.gestationalAge)
      .map(c => {
        const m = c.gestationalAge.match(/(\d+)/);
        return { week: m ? parseInt(m[1]) : 0, value: parseFloat(c.weight) };
      })
      .filter(d => d.week > 0 && !isNaN(d.value))
      .sort((a, b) => a.week - b.week),
    [record.prenatalConsultations]
  );

  const uterineHeightData = useMemo(() =>
    record.prenatalConsultations
      .filter(c => c.uterineHeight && c.gestationalAge)
      .map(c => {
        const m = c.gestationalAge.match(/(\d+)/);
        return { week: m ? parseInt(m[1]) : 0, value: parseFloat(c.uterineHeight) };
      })
      .filter(d => d.week > 0 && !isNaN(d.value))
      .sort((a, b) => a.week - b.week),
    [record.prenatalConsultations]
  );

  // Checklists
  const examChecklist = useMemo(() => {
    const done = record.gestationalExams.map(e => e.type);
    return (["1", "2", "3"] as const).map(tri => {
      const expected = EXAMS_BY_TRIMESTER[tri];
      const completed = expected.filter(e => done.includes(e));
      return { tri, total: expected.length, done: completed.length };
    });
  }, [record.gestationalExams]);

  const vaccineChecklist = useMemo(() => {
    const recommended = VACCINES_BRAZIL.filter(v => v.category === "recomendada");
    const applied = (record.vaccines || []).map(v => v.name);
    const done = recommended.filter(v => applied.includes(v.name)).length;
    return { total: recommended.length, done };
  }, [record.vaccines]);

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      {gc.dum && (
        <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-heading font-bold text-foreground">Progresso da Gestação</p>
              <p className="text-sm font-heading font-bold text-secondary">{igAtual}</p>
            </div>
            <div className="relative w-full h-4 bg-muted/30 rounded-full overflow-hidden">
              <div className="absolute h-full rounded-full bg-gradient-to-r from-secondary/60 to-secondary transition-all" style={{ width: `${progressPct}%` }} />
              {[13, 27].map(w => (
                <div key={w} className="absolute top-0 h-full w-px bg-border/60" style={{ left: `${(w / totalWeeks) * 100}%` }} />
              ))}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-muted-foreground">1º Tri</span>
              <span className="text-[9px] text-muted-foreground">2º Tri</span>
              <span className="text-[9px] text-muted-foreground">3º Tri</span>
              <span className="text-[9px] text-muted-foreground">42s</span>
            </div>
            {gc.dpp && <p className="text-[10px] text-muted-foreground text-right mt-1">DPP: {format(new Date(gc.dpp), "dd/MM/yyyy")}</p>}
          </CardContent>
        </Card>
      )}

      {/* Key Data */}
      <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Tipo Sanguíneo", value: gc.bloodType ? `${gc.bloodType} ${gc.rh}` : "—" },
              { label: "G / P / A", value: gc.gravida ? `G${gc.gravida}P${gc.para}A${gc.abortions}` : "—" },
              { label: "Peso Pré-gest.", value: gc.preGestationalWeight ? `${gc.preGestationalWeight} kg` : "—" },
              { label: "IMC Pré-gest.", value: gc.preGestationalBmi || "—" },
              { label: "Classificação", value: gc.riskClassification === "habitual" ? "Risco Habitual" : "Alto Risco" },
              { label: "IG Atual", value: igAtual },
              ...(lastConsult ? [
                { label: "Último Peso", value: lastConsult.weight ? `${lastConsult.weight}kg` : "—" },
                { label: "Última PA", value: lastConsult.bloodPressure || "—" },
                { label: "Último BCF", value: lastConsult.fetalHeartRate ? `${lastConsult.fetalHeartRate}bpm` : "—" },
                { label: "IMC Atual", value: currentIMC ? `${currentIMC}` : "—" },
              ] : []),
            ].map(item => (
              <div key={item.label} className="bg-white/30 backdrop-blur-lg rounded-xl p-3 text-center">
                <p className="text-[10px] text-muted-foreground font-heading uppercase">{item.label}</p>
                <p className="text-sm font-heading font-bold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FilterableChart data={weightData} label="Curva de Ganho de Peso (kg × semana)" currentWeek={igWeeks} />
            <FilterableChart data={uterineHeightData} label="Curva de Altura Uterina (cm × semana)" color="hsl(var(--primary))" currentWeek={igWeeks} />
          </div>
        </CardContent>
      </Card>

      {/* Checklist Visual */}
      <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-heading">Checklist de Acompanhamento</CardTitle></CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {examChecklist.map(({ tri, total, done }) => (
              <div key={tri} className="bg-white/30 rounded-xl p-3 text-center">
                <p className="text-[10px] text-muted-foreground font-heading uppercase">Exames {tri}º Tri</p>
                <p className={`text-sm font-heading font-bold ${done === total ? "text-green-600" : "text-amber-600"}`}>{done}/{total}</p>
                <div className="w-full h-1.5 bg-muted/30 rounded-full mt-1">
                  <div className={`h-full rounded-full ${done === total ? "bg-green-500" : "bg-amber-400"}`} style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
            <div className="bg-white/30 rounded-xl p-3 text-center">
              <p className="text-[10px] text-muted-foreground font-heading uppercase">Vacinas Recom.</p>
              <p className={`text-sm font-heading font-bold ${vaccineChecklist.done === vaccineChecklist.total ? "text-green-600" : "text-amber-600"}`}>{vaccineChecklist.done}/{vaccineChecklist.total}</p>
              <div className="w-full h-1.5 bg-muted/30 rounded-full mt-1">
                <div className={`h-full rounded-full ${vaccineChecklist.done === vaccineChecklist.total ? "bg-green-500" : "bg-amber-400"}`} style={{ width: `${vaccineChecklist.total > 0 ? (vaccineChecklist.done / vaccineChecklist.total) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health & History */}
      <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg">
        <CardContent className="p-4 space-y-3">
          <p className="text-xs font-heading font-semibold text-foreground">Saúde e Histórico</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { label: "Alergias", value: gc.allergies },
              { label: "Medicamentos", value: gc.medications },
              { label: "Condições pré-existentes", value: gc.preExistingConditions },
              { label: "Cirurgias anteriores", value: gc.previousSurgeries },
              { label: "Histórico familiar", value: gc.familyHistory },
            ].filter(v => v.value).map(item => (
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
            ].filter(v => v.value).map(item => (
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
    </div>
  );
};

export default GestationalCard;
