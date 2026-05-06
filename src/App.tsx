import { useMutation } from "@tanstack/react-query";
import { ProfileOverview } from "@/features/analysis/ProfileOverview";
import { ChartGrid } from "@/features/charts/ChartGrid";
import { InsightPanel } from "@/features/insights/InsightPanel";
import { UploadDropzone } from "@/features/upload/UploadDropzone";
import { postEda, postInsights, postProfile } from "@/lib/api-client";
import { useDataStore } from "@/stores/useDataStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

const UPLOAD_MAX = 4_194_304;

export default function App() {
  const csvText = useDataStore((s) => s.csvText);
  const filename = useDataStore((s) => s.filename);
  const target = useDataStore((s) => s.target);
  const profile = useDataStore((s) => s.profile);
  const eda = useDataStore((s) => s.eda);
  const insight = useDataStore((s) => s.insight);
  const setCsv = useDataStore((s) => s.setCsv);
  const setTarget = useDataStore((s) => s.setTarget);
  const setProfile = useDataStore((s) => s.setProfile);
  const setEda = useDataStore((s) => s.setEda);
  const setInsight = useDataStore((s) => s.setInsight);

  const analyzeMut = useMutation({
    mutationFn: async () => {
      const p = await postProfile(csvText, filename || undefined);
      const tgt = target?.trim() || p.targetCandidate || null;
      const e = await postEda(csvText, tgt);
      setProfile(p);
      setEda(e);
      if (tgt) setTarget(tgt);
    },
  });

  const insightMut = useMutation({
    mutationFn: async () => {
      if (!profile || !eda) throw new Error("먼저 프로파일 + EDA를 실행하세요.");
      const res = await postInsights(profile, eda, filename || null);
      setInsight(res);
    },
  });

  const analyzeError = analyzeMut.error instanceof Error ? analyzeMut.error.message : analyzeMut.error ? String(analyzeMut.error) : null;
  const insightError =
    insightMut.error instanceof Error ? insightMut.error.message : insightMut.error ? String(insightMut.error) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-sky-400">AutoData Insight</p>
            <h1 className="mt-1 text-3xl font-semibold text-white">자동화된 데이터 분석 MVP</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
              CSV를 업로드하면 Python 서버에서 프로파일링·EDA를 수행하고, Recharts 대시보드와 GPT 기반 요약까지 한 화면에서 확인합니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>Vite · React · Tailwind</Badge>
            <Badge>Vercel Python API</Badge>
            <Badge>OpenAI</Badge>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-10">
        <UploadDropzone
          maxBytes={UPLOAD_MAX}
          onLoaded={(text, name) => {
            setCsv(text, name);
            setInsight(null);
          }}
        />

        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="text-base">실행 패널</CardTitle>
              <CardDescription>분석 타깃 컬럼(선택): 비우면 후보값을 서버 추정합니다.</CardDescription>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                placeholder="예: y"
                value={target ?? ""}
                onChange={(e) => setTarget(e.target.value.trim() ? e.target.value : null)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-500 sm:w-40"
              />
              <Button
                type="button"
                disabled={!csvText.trim() || analyzeMut.isPending}
                onClick={() => {
                  setInsight(null);
                  analyzeMut.mutate();
                }}
                className="gap-2"
              >
                {analyzeMut.isPending ? <Spinner /> : null}
                프로파일 + EDA 실행
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={!profile || !eda || insightMut.isPending}
                onClick={() => insightMut.mutate()}
                className="gap-2"
              >
                {insightMut.isPending ? <Spinner /> : null}
                AI 인사이트 생성
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {csvText ? (
              <p className="truncate font-mono text-xs text-slate-500">
                로드된 파일: {filename || "unnamed.csv"} · 크기 {(new TextEncoder().encode(csvText).length / 1024).toFixed(1)} KiB
              </p>
            ) : (
              <p className="text-xs text-slate-500">아직 업로드된 데이터가 없습니다.</p>
            )}
            {(analyzeError || insightError) && (
              <p className="mt-3 text-sm text-rose-400">{analyzeError || insightError}</p>
            )}
          </CardContent>
        </Card>

        {profile ? <ProfileOverview profile={profile} /> : null}

        {eda ? (
          <Card>
            <CardHeader>
              <CardTitle>3. 차트 대시보드</CardTitle>
              <CardDescription>데이터 성격에 맞춘 6종 패턴 차트 및 Mercedes 스타일 이진·히트맵</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartGrid eda={eda} />
            </CardContent>
          </Card>
        ) : null}

        {insight ? <InsightPanel insight={insight} /> : null}

        {eda && !insight && !insightMut.isPending ? (
          <p className="text-center text-sm text-slate-500">
            인사이트를 보려면 “AI 인사이트 생성”을 누르세요.
          </p>
        ) : null}
      </main>

      <footer className="border-t border-slate-800 px-4 py-6 text-center text-xs text-slate-500">
        로컬 API는 <code className="text-slate-400">vercel dev</code> 또는 Vite 프록시(http://localhost:3000)로 함께 실행하세요.
      </footer>
    </div>
  );
}
