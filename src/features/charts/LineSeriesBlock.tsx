import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LineSeriesBlock as LS } from "@/lib/types";

export function LineSeriesBlockChart({ block }: { block: LS }) {
  const data = block.times.map((t, i) => ({
    t: t.slice(0, 10),
    full: t,
    v: block.values[i],
  }));
  const label =
    block.metric == null ? `${block.column} (일별 건수)` : `${block.column} 일별 평균 (${block.metric})`;

  return (
    <Card className="h-[320px]">
      <CardHeader className="pb-0">
        <CardTitle className="truncate text-sm text-slate-200" title={label}>
          라인 추이 — {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[240px] pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="t" tick={{ fill: "#94a3b8", fontSize: 9 }} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} width={44} domain={["auto", "auto"]} />
            <Tooltip
              contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }}
              labelFormatter={(_, payload) => (payload[0]?.payload?.full as string) ?? ""}
            />
            <Line type="monotone" dataKey="v" stroke="#38bdf8" dot={false} strokeWidth={1.5} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
