import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ClinicalRecord } from "@/contexts/ClinicalRecordContext";
import { format } from "date-fns";
import { calcGestationalAge, calcGestationalWeeks, calcDPP, calcIMC, getTrimesterFromIG, EXAMS_BY_TRIMESTER, VACCINES_BRAZIL } from "./constants";
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
  const dpp = gc.dpp || calcDPP(gc.dum);
  const daysUntilDPP = dpp ? Math.max(0, Math.ceil((new Date(dpp).getTime() - Date.now()) / (24 * 60 * 60 * 1000))) : 0;

  const realizadas = record.prenatalConsultations.filter(c => c.status === "realizada").sort((a, b) => b.date.localeCompare(a.date));
  const lastConsult = realizadas[0];

  const currentIMC = lastConsult?.weight ? calcIMC(lastConsult.weight, gc.height) : "";
  const preGestIMC = gc.preGestationalBmi;

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

  // Checklists by trimester
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

  // Risk indicators
  const riskIndicators = useMemo(() => {
    const indicators: { label: string; status: "ok" | "warn" | "danger" }[] = [];
    if (lastConsult) {
      const bp = lastConsult.bloodPressure?.match(/(\d+)\s*[\/x]\s*(\d+)/);
      if (bp) {
        const sys = parseInt(bp[1]), dia = parseInt(bp[2]);
        indicators.push({ label: `PA ${lastConsult.bloodPressure}`, status: sys >= 140 || dia >= 90 ? "danger" : sys >= 130 || dia >= 85 ? "warn" : "ok" });
      }
    }
    if (gc.riskClassification === "alto_risco") {
      indicators.push({ label: "Alto Risco", status: "danger" });
    } else {
      indicators.push({ label: "Risco Habitual", status: "ok" });
    }
    if (igWeeks >= 42) indicators.push({ label: "Pós-Termo", status: "danger" });
    else if (igWeeks >= 37) indicators.push({ label: "Termo", status: "ok" });
    return indicators;
  }, [lastConsult, gc.riskClassification, igWeeks]);

  const riskColor = { ok: "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300", warn: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300", danger: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300" };

  return (
    <div className="space-y-4">
      {/* Progress Bar with trimester gradient */}
      {gc.dum && (
        <Card className="clinical-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-3">
                <p className="text-xs font-heading font-bold text-foreground">Progresso da Gestação</p>
                {riskIndicators.map((ri, i) => (
                  <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full font-heading font-medium ${riskColor[ri.status]}`}>{ri.label}</span>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm font-heading font-bold text-secondary">{igAtual}</p>
                <span className="text-[10px] text-muted-foreground">({Math.round(progressPct)}%)</span>
              </div>
            </div>
            <div className="relative w-full h-5 bg-muted/30 rounded-full overflow-hidden mt-2">
              <div className="absolute h-full rounded-full pregnancy-progress-fill transition-all" style={{ width: `${progressPct}%` }} />
              {[13, 27].map(w => (
                <div key={w} className="absolute top-0 h-full w-px bg-foreground/20" style={{ left: `${(w / totalWeeks) * 100}%` }} />
              ))}
              {/* Current position marker */}
              <div className="absolute top-[-2px] w-2.5 h-2.5 rounded-full bg-foreground border-2 border-background shadow-sm" style={{ left: `calc(${progressPct}% - 5px)`, top: '50%', transform: 'translateY(-50%)' }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-muted-foreground font-heading">1º Tri (0-13s)</span>
              <span className="text-[9px] text-muted-foreground font-heading">2º Tri (14-27s)</span>
              <span className="text-[9px] text-muted-foreground font-heading">3º Tri (28-42s)</span>
            </div>
            <div className="flex justify-between mt-2">
              {dpp && (
                <p className="text-[10px] text-muted-foreground">DPP: <span className="font-heading font-semibold">{format(new Date(dpp), "dd/MM/yyyy")}</span> ({daysUntilDPP} dias restantes)</p>
              )}
              <p className="text-[10px] text-muted-foreground">Consultas: <span className="font-heading font-semibold">{realizadas.length}</span></p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last consultation quick stats */}
      {lastConsult && (
        <Card className="clinical-card">
          <CardContent className="p-4">
            <p className="text-[10px] text-muted-foreground font-heading uppercase mb-2">Últimos dados — consulta {format(new Date(lastConsult.date), "dd/MM/yyyy")}</p>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {[
                { label: "Peso", value: lastConsult.weight ? `${lastConsult.weight}kg` : "—", sub: currentIMC ? `IMC ${currentIMC}` : undefined },
                { label: "PA", value: lastConsult.bloodPressure || "—" },
                { label: "AU", value: lastConsult.uterineHeight ? `${lastConsult.uterineHeight}cm` : "—" },
                { label: "BCF", value: lastConsult.fetalHeartRate ? `${lastConsult.fetalHeartRate}bpm` : "—" },
                { label: "Edema", value: lastConsult.edema || "—" },
                { label: "Apresentação", value: lastConsult.fetalPresentation || "—" },
              ].map(item => (
                <div key={item.label} className="bg-white/30 dark:bg-white/5 backdrop-blur-lg rounded-xl p-2.5 text-center">
                  <p className="text-[9px] text-muted-foreground font-heading">{item.label}</p>
                  <p className="text-sm font-heading font-bold text-foreground">{item.value}</p>
                  {item.sub && <p className="text-[9px] text-muted-foreground">{item.sub}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Data */}
      <Card className="clinical-card">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Tipo Sanguíneo", value: gc.bloodType ? `${gc.bloodType} ${gc.rh}` : "—" },
              { label: "G / P / A", value: gc.gravida ? `G${gc.gravida}P${gc.para}A${gc.abortions}` : "—" },
              { label: "Peso Pré-gest.", value: gc.preGestationalWeight ? `${gc.preGestationalWeight} kg` : "—" },
              { label: "IMC Pré-gest.", value: preGestIMC || "—" },
              { label: "Classificação", value: gc.riskClassification === "habitual" ? "Risco Habitual" : "Alto Risco" },
              { label: "Altura", value: gc.height ? `${gc.height}m` : "—" },
            ].map(item => (
              <div key={item.label} className="bg-white/30 dark:bg-white/5 backdrop-blur-lg rounded-xl p-3 text-center">
                <p className="text-[10px] text-muted-foreground font-heading uppercase">{item.label}</p>
                <p className="text-sm font-heading font-bold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <Card className="clinical-card">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FilterableChart data={weightData} label="Curva de Ganho de Peso (kg × semana)" currentWeek={igWeeks} />
            <FilterableChart data={uterineHeightData} label="Curva de Altura Uterina (cm × semana)" color="hsl(var(--primary))" currentWeek={igWeeks} />
          </div>
        </CardContent>
      </Card>

      {/* Checklist Visual */}
      <Card className="clinical-card">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-heading">Checklist de Acompanhamento por Trimestre</CardTitle></CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {examChecklist.map(({ tri, total, done }) => {
              const isCurrentTri = tri === String(getTrimesterFromIG(igWeeks));
              return (
                <div key={tri} className={`bg-white/30 dark:bg-white/5 rounded-xl p-3 text-center ${isCurrentTri ? "ring-2 ring-secondary/30" : ""}`}>
                  <p className="text-[10px] text-muted-foreground font-heading uppercase">
                    {isCurrentTri ? "" : ""}Exames {tri}º Tri
                  </p>
                  <p className={`text-sm font-heading font-bold ${done === total ? "text-green-600" : "text-amber-600"}`}>{done}/{total}</p>
                  <div className="w-full h-1.5 bg-muted/30 rounded-full mt-1">
                    <div className={`h-full rounded-full transition-all ${done === total ? "bg-green-500" : "bg-amber-400"}`} style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }} />
                  </div>
                  {done === total && <span className="text-[9px] text-green-600">Completo</span>}
                </div>
              );
            })}
            <div className="bg-white/30 dark:bg-white/5 rounded-xl p-3 text-center">
              <p className="text-[10px] text-muted-foreground font-heading uppercase">Vacinas Recom.</p>
              <p className={`text-sm font-heading font-bold ${vaccineChecklist.done === vaccineChecklist.total ? "text-green-600" : "text-amber-600"}`}>{vaccineChecklist.done}/{vaccineChecklist.total}</p>
              <div className="w-full h-1.5 bg-muted/30 rounded-full mt-1">
                <div className={`h-full rounded-full transition-all ${vaccineChecklist.done === vaccineChecklist.total ? "bg-green-500" : "bg-amber-400"}`} style={{ width: `${vaccineChecklist.total > 0 ? (vaccineChecklist.done / vaccineChecklist.total) * 100 : 0}%` }} />
              </div>
              {vaccineChecklist.done === vaccineChecklist.total && <span className="text-[9px] text-green-600">Completo</span>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health & History */}
      <Card className="clinical-card">
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
              <div key={item.label} className="bg-white/30 dark:bg-white/5 backdrop-blur-lg rounded-xl p-3">
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
              <div key={item.label} className="bg-white/30 dark:bg-white/5 backdrop-blur-lg rounded-xl p-3">
                <p className="text-[10px] text-muted-foreground font-heading uppercase">{item.label}</p>
                <p className="text-sm text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
          {gc.birthPlan && (
            <div className="bg-white/30 dark:bg-white/5 backdrop-blur-lg rounded-xl p-3">
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
