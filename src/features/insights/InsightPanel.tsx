import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { InsightPayload } from "@/lib/types";

export function InsightPanel({ insight }: { insight: InsightPayload }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>4. AI 인사이트</CardTitle>
        <CardDescription>OpenAI {insight.model ?? "모델"} 기반 요약 — 한국어</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section>
          <h3 className="mb-2 text-sm font-semibold text-sky-300">핵심 특징</h3>
          <ul className="list-inside list-decimal space-y-1 text-sm text-slate-300">
            {insight.highlights.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="mb-2 text-sm font-semibold text-amber-300">이상·리스크</h3>
          <ul className="list-inside list-disc space-y-1 text-sm text-slate-300">
            {insight.anomalies.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="mb-2 text-sm font-semibold text-emerald-300">액션 플랜</h3>
          <ul className="list-inside list-disc space-y-1 text-sm text-slate-300">
            {insight.actions.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </section>
      </CardContent>
    </Card>
  );
}
