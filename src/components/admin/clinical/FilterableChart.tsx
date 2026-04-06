import { useState, useMemo } from "react";

interface ChartProps {
  data: { week: number; value: number }[];
  label: string;
  color?: string;
  currentWeek?: number;
}

const FilterableChart = ({ data, label, color = "hsl(var(--secondary))", currentWeek }: ChartProps) => {
  const [fromWeek, setFromWeek] = useState<number | "">("");
  const [toWeek, setToWeek] = useState<number | "">("");

  const quickFilters = useMemo(() => {
    const cw = currentWeek || 40;
    const trim = cw <= 13 ? 1 : cw <= 27 ? 2 : 3;
    return [
      { label: "1º Tri", from: 1, to: 13 },
      { label: "2º Tri", from: 14, to: 27 },
      { label: "3º Tri", from: 28, to: 42 },
      { label: `Tri Atual (${trim}º)`, from: trim === 1 ? 1 : trim === 2 ? 14 : 28, to: trim === 1 ? 13 : trim === 2 ? 27 : 42 },
      { label: "Últ. 4 sem", from: Math.max(1, cw - 4), to: cw },
      { label: "Tudo", from: 1, to: 42 },
    ];
  }, [currentWeek]);

  const filteredData = useMemo(() => {
    if (data.length === 0) return [];
    const f = fromWeek === "" ? 1 : fromWeek;
    const t = toWeek === "" ? 42 : toWeek;
    return data.filter(d => d.week >= f && d.week <= t);
  }, [data, fromWeek, toWeek]);

  const applyQuick = (from: number, to: number) => { setFromWeek(from); setToWeek(to); };

  if (data.length < 2) return <p className="text-xs text-muted-foreground text-center py-4">Dados insuficientes para gráfico</p>;

  const chartData = filteredData.length >= 2 ? filteredData : data;
  const minW = Math.min(...chartData.map(d => d.week));
  const maxW = Math.max(...chartData.map(d => d.week));
  const minV = Math.min(...chartData.map(d => d.value)) * 0.9;
  const maxV = Math.max(...chartData.map(d => d.value)) * 1.1;
  const w = 320, h = 160, px = 40, py = 20;
  const scaleX = (wk: number) => px + ((wk - minW) / (maxW - minW || 1)) * (w - 2 * px);
  const scaleY = (v: number) => h - py - ((v - minV) / (maxV - minV || 1)) * (h - 2 * py);
  const points = chartData.map(d => `${scaleX(d.week)},${scaleY(d.value)}`).join(" ");

  return (
    <div>
      <p className="text-xs font-heading font-semibold text-foreground mb-2">{label}</p>
      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        {quickFilters.map((q) => (
          <button
            key={q.label}
            onClick={() => applyQuick(q.from, q.to)}
            className={`text-[10px] px-2 py-0.5 rounded-full font-heading transition-colors ${
              fromWeek === q.from && toWeek === q.to
                ? "bg-secondary text-secondary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            {q.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 mb-2">
        <label className="text-[10px] text-muted-foreground">De semana</label>
        <input type="number" min={1} max={42} placeholder="1" value={fromWeek} onChange={e => setFromWeek(e.target.value ? Number(e.target.value) : "")} className="w-14 h-6 text-[10px] text-center rounded-md border border-border/50 bg-background/50 focus:outline-none focus:ring-1 focus:ring-secondary" />
        <label className="text-[10px] text-muted-foreground">até</label>
        <input type="number" min={1} max={42} placeholder="42" value={toWeek} onChange={e => setToWeek(e.target.value ? Number(e.target.value) : "")} className="w-14 h-6 text-[10px] text-center rounded-md border border-border/50 bg-background/50 focus:outline-none focus:ring-1 focus:ring-secondary" />
      </div>
      {filteredData.length < 2 && (fromWeek !== "" || toWeek !== "") ? (
        <p className="text-xs text-muted-foreground text-center py-4">Sem dados no intervalo selecionado</p>
      ) : (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-sm">
          {[0, 0.25, 0.5, 0.75, 1].map((f) => {
            const y = h - py - f * (h - 2 * py);
            const val = (minV + f * (maxV - minV)).toFixed(1);
            return <g key={f}><line x1={px} y1={y} x2={w - px} y2={y} stroke="hsl(var(--border))" strokeWidth="0.5" /><text x={px - 4} y={y + 3} textAnchor="end" fill="hsl(var(--muted-foreground))" fontSize="8">{val}</text></g>;
          })}
          {chartData.map((d) => (
            <text key={d.week} x={scaleX(d.week)} y={h - 4} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="8">{d.week}s</text>
          ))}
          <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
          {chartData.map((d, i) => (
            <circle key={i} cx={scaleX(d.week)} cy={scaleY(d.value)} r="3" fill={color} />
          ))}
        </svg>
      )}
    </div>
  );
};

export default FilterableChart;
