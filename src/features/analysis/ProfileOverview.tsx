import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProfilePayload } from "@/lib/types";

export function ProfileOverview({ profile }: { profile: ProfilePayload }) {
  const worst = [...profile.missing].sort((a, b) => b.pct - a.pct).slice(0, 8);
  return (
    <Card>
      <CardHeader>
        <CardTitle>2. 프로파일</CardTitle>
        <CardDescription>
          {profile.rowCount.toLocaleString()}행 × {profile.columnCount.toLocaleString()}열 — 타입·결측·요약지표
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {Object.entries(profile.dtypeGroups).map(([k, v]) => (
            <Badge key={k}>
              {k}: {v}
            </Badge>
          ))}
        </div>
        <div>
          <h3 className="mb-2 text-sm font-medium text-slate-200">결측 상위</h3>
          <div className="max-h-40 overflow-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="sticky top-0 bg-slate-900 text-slate-400">
                <tr>
                  <th className="px-3 py-2">컬럼</th>
                  <th className="px-3 py-2">건수</th>
                  <th className="px-3 py-2">비율</th>
                </tr>
              </thead>
              <tbody>
                {worst.map((m) => (
                  <tr key={m.column} className="border-t border-slate-800">
                    <td className="px-3 py-1.5 font-mono">{m.column}</td>
                    <td className="px-3 py-1.5">{m.count}</td>
                    <td className="px-3 py-1.5">{(m.pct * 100).toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-medium text-slate-200">수치 요약 (일부)</h3>
          <div className="max-h-48 overflow-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="sticky top-0 bg-slate-900 text-slate-400">
                <tr>
                  <th className="px-3 py-2">컬럼</th>
                  <th className="px-3 py-2">mean</th>
                  <th className="px-3 py-2">std</th>
                  <th className="px-3 py-2">q50</th>
                </tr>
              </thead>
              <tbody>
                {profile.numericSummary.slice(0, 12).map((n) => (
                  <tr key={n.column} className="border-t border-slate-800">
                    <td className="px-3 py-1.5 font-mono">{n.column}</td>
                    <td className="px-3 py-1.5">{n.mean.toFixed(4)}</td>
                    <td className="px-3 py-1.5">{n.std.toFixed(4)}</td>
                    <td className="px-3 py-1.5">{n.q50.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
