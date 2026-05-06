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
import type { BinaryStackItem } from "@/lib/types";

export function BinaryStackBlockChart({ rows }: { rows: BinaryStackItem[] }) {
  const data = rows.slice(0, 16).map((r) => ({ name: r.column.slice(0, 24), zero: r.zero, one: r.one }));
  return (
    <Card className="h-[480px]">
      <CardHeader className="pb-0">
        <CardTitle className="text-sm text-slate-200">이진(0/1) 컬럼 분포 (상위 16)</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px] pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
            <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 10 }} />
            <YAxis type="category" dataKey="name" width={96} tick={{ fill: "#94a3b8", fontSize: 9 }} />
            <Tooltip
              contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }}
              formatter={(v: number, name: string) => [v, name === "zero" ? "0" : "1"]}
            />
            <Bar dataKey="zero" stackId="a" fill="#475569" />
            <Bar dataKey="one" stackId="a" fill="#38bdf8" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
