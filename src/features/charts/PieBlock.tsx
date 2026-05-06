import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PieBlock as PB } from "@/lib/types";

const COLORS = ["#38bdf8", "#a78bfa", "#34d399", "#fbbf24", "#f472b6", "#94a3b8"];

export function PieBlockChart({ block }: { block: PB }) {
  const data = block.items.map((it) => ({ name: it.label, value: it.count }));
  return (
    <Card className="h-[320px]">
      <CardHeader className="pb-0">
        <CardTitle className="text-sm text-slate-200">구성 비중 — {block.column}</CardTitle>
      </CardHeader>
      <CardContent className="h-[240px] pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={24} stroke="#0f172a">
              {data.map((_, i) => (
                <Cell key={`c-${i}`} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }}
              formatter={(v: number | string) => [String(v), "건수"]}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
