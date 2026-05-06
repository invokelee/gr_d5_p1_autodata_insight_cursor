import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CorrelationPayload } from "@/lib/types";

function cellColor(v: number | null): string {
  if (v === null || Number.isNaN(v)) return "rgb(15 23 42)";
  const t = (Math.max(-1, Math.min(1, v)) + 1) / 2;
  const r = Math.round(30 + (1 - t) * 80);
  const g = Math.round(64 + t * 120);
  const b = Math.round(120 + (1 - t) * 90);
  return `rgb(${r} ${g} ${b})`;
}

export function CorrelationHeatmap({ corr }: { corr: CorrelationPayload }) {
  const { columns, matrix } = corr;
  if (!columns.length || !matrix.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-slate-200">상관 계수 히트맵 (부분 행렬)</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="border-collapse text-[9px]">
          <thead>
            <tr>
              <th className="border border-slate-800 bg-slate-900 p-1" />
              {columns.map((c) => (
                <th
                  key={c}
                  className="max-w-[72px] truncate border border-slate-800 bg-slate-900 p-1 font-normal text-slate-400"
                  title={c}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={columns[i]}>
                <th
                  className="max-w-[120px] truncate border border-slate-800 bg-slate-900 p-1 text-right font-normal text-slate-400"
                  title={columns[i]}
                >
                  {columns[i]}
                </th>
                {row.map((v, j) => {
                  const num = v == null ? null : Number(v);
                  return (
                    <td
                      key={`${i}-${j}`}
                      className="h-7 min-w-[36px] border border-slate-800 text-center text-white/90"
                      style={{ backgroundColor: cellColor(num) }}
                      title={`${columns[i]} vs ${columns[j]}: ${num == null || Number.isNaN(num) ? "n/a" : num.toFixed(3)}`}
                    >
                      {num != null && !Number.isNaN(num) ? num.toFixed(1) : "·"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
