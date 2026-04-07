import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ChartProps {
  data: { week: number; value: number; date?: string }[];
  label: string;
  color?: string;
  currentWeek?: number;
  dum?: string;
}

const FilterableChart = ({ data, label, color = "hsl(var(--secondary))", currentWeek, dum }: ChartProps) => {
  const today = new Date().toISOString().split("T")[0];

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filteredData = useMemo(() => {
    if (data.length === 0) return [];
    if (!dateFrom && !dateTo) return data;

    return data.filter(d => {
      if (!d.date) return true;
      if (dateFrom && d.date < dateFrom) return false;
      if (dateTo && d.date > dateTo) return false;
      return true;
    });
  }, [data, dateFrom, dateTo]);

  const clearFilter = () => {
    setDateFrom("");
    setDateTo("");
  };

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

  const hasFilter = dateFrom || dateTo;

  return (
    <div>
      <p className="text-xs font-heading font-semibold text-foreground mb-2">{label}</p>
      <div className="flex items-end gap-2 mb-3 flex-wrap">
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">De</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            max={dateTo || today}
            className="h-7 text-xs rounded-lg w-[130px]"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Até</Label>
          <Input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            min={dateFrom}
            max={today}
            className="h-7 text-xs rounded-lg w-[130px]"
          />
        </div>
        {hasFilter && (
          <button
            onClick={clearFilter}
            className="text-[10px] text-muted-foreground hover:text-foreground font-heading px-2 py-1 rounded-lg bg-muted/50 h-7"
          >
            Limpar
          </button>
        )}
        {!hasFilter && (
          <span className="text-[10px] text-muted-foreground h-7 flex items-center">Toda a gestação</span>
        )}
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
