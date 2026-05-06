import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TargetDistPayload } from "@/lib/types";

export function TargetCharts({ dist }: { dist: TargetDistPayload }) {
  const sorted = dist.sortedIndex.x.map((x, i) => ({ x, y: dist.sortedIndex.y[i] ?? 0 }));
  const hist = dist.bins.map((b, i) => ({
    name: `${b.toFixed(2)}`,
    v: dist.counts[i] ?? 0,
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="h-[320px]">
        <CardHeader className="pb-0">
          <CardTitle className="text-sm text-slate-200">정렬된 목표값 — {dist.column}</CardTitle>
        </CardHeader>
        <CardContent className="h-[240px] pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sorted} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="x" tick={{ fill: "#94a3b8", fontSize: 9 }} hide />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} width={40} />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }}
                formatter={(v: number) => [v.toFixed(4), dist.column]}
              />
              <Line type="monotone" dataKey="y" stroke="#fbbf24" dot={false} strokeWidth={1.5} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="h-[320px]">
        <CardHeader className="pb-0">
          <CardTitle className="text-sm text-slate-200">목표값 분포(히스토그램) — {dist.column}</CardTitle>
        </CardHeader>
        <CardContent className="h-[240px] pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hist} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 9 }} interval="preserveStartEnd" />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} width={32} />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }}
              />
              <Bar dataKey="v" fill="#fbbf24" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
