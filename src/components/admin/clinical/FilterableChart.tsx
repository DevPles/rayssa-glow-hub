import { useState, useMemo } from "react";

interface ChartProps {
  data: { week: number; value: number }[];
  label: string;
  color?: string;
  currentWeek?: number;
}

const FilterableChart = ({ data, label, color = "hsl(var(--secondary))", currentWeek }: ChartProps) => {
  const cw = currentWeek || 40;
  const currentTrim = cw <= 13 ? 1 : cw <= 27 ? 2 : 3;

  const filters = useMemo(() => [
    { key: "current", label: `${currentTrim}º Tri (atual)`, from: currentTrim === 1 ? 1 : currentTrim === 2 ? 14 : 28, to: currentTrim === 1 ? 13 : currentTrim === 2 ? 27 : 42 },
    { key: "last4", label: "Últ. 4 sem", from: Math.max(1, cw - 4), to: cw },
    { key: "1tri", label: "1º Tri", from: 1, to: 13 },
    { key: "2tri", label: "2º Tri", from: 14, to: 27 },
    { key: "3tri", label: "3º Tri", from: 28, to: 42 },
    { key: "all", label: "Toda gestação", from: 1, to: 42 },
  ], [currentTrim, cw]);

  const [active, setActive] = useState("current");

  const activeFilter = filters.find(f => f.key === active) || filters[0];

  const filteredData = useMemo(() => {
    if (data.length === 0) return [];
    return data.filter(d => d.week >= activeFilter.from && d.week <= activeFilter.to);
  }, [data, activeFilter]);

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
      <div className="flex flex-wrap items-center gap-1 mb-3">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setActive(f.key)}
            className={`text-[10px] px-2.5 py-1 rounded-full font-heading transition-colors ${
              active === f.key
                ? "bg-secondary text-secondary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      {filteredData.length < 2 ? (
        <p className="text-xs text-muted-foreground text-center py-4">Sem dados no período selecionado</p>
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
