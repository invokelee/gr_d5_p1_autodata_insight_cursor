import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HistogramBlock as HB } from "@/lib/types";

export function HistogramBlockChart({ block }: { block: HB }) {
  const data = block.bins.map((b, i) => ({
    name: i === block.bins.length - 1 ? `≥${b.toFixed(3)}` : `${b.toFixed(3)}`,
    v: block.counts[i] ?? 0,
  }));
  return (
    <Card className="h-[320px]">
      <CardHeader className="pb-0">
        <CardTitle className="text-sm text-slate-200">히스토그램 — {block.column}</CardTitle>
      </CardHeader>
      <CardContent className="h-[240px] pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} width={32} />
            <Tooltip
              contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }}
              labelStyle={{ color: "#e2e8f0" }}
            />
            <Bar dataKey="v" fill="#38bdf8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
