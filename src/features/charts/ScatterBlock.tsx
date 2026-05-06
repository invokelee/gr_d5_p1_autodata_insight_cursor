import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ScatterBlock as SB } from "@/lib/types";

export function ScatterBlockChart({ block }: { block: SB }) {
  const data = block.points.map(([xv, yv]) => ({ x: xv, y: yv }));
  return (
    <Card className="h-[340px]">
      <CardHeader className="pb-0">
        <CardTitle className="text-sm text-slate-200">
          산점도 — {block.x} × {block.y}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[260px] pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="x" type="number" name={block.x} tick={{ fill: "#94a3b8", fontSize: 10 }} />
            <YAxis dataKey="y" type="number" name={block.y} tick={{ fill: "#94a3b8", fontSize: 10 }} />
            <ZAxis range={[40, 40]} />
            <Tooltip cursor={{ strokeDasharray: "3 3", stroke: "#64748b" }} />
            <Scatter data={data} fill="#34d399" fillOpacity={0.55} />
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
