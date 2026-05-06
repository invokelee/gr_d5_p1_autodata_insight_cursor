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
import type { TopBarBlock as TB } from "@/lib/types";

export function TopBarBlockChart({ block }: { block: TB }) {
  const data = block.items.map((it) => ({ name: it.label.slice(0, 24), v: it.count }));
  return (
    <Card className="h-[320px]">
      <CardHeader className="pb-0">
        <CardTitle className="text-sm text-slate-200">상위 범주 — {block.column}</CardTitle>
      </CardHeader>
      <CardContent className="h-[240px] pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
            <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 10 }} />
            <YAxis type="category" dataKey="name" width={90} tick={{ fill: "#94a3b8", fontSize: 9 }} />
            <Tooltip
              contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }}
              labelStyle={{ color: "#e2e8f0" }}
            />
            <Bar dataKey="v" fill="#a78bfa" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
