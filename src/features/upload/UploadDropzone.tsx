import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const DEFAULT_MAX = 4_194_304; // 4 MiB

type Props = {
  onLoaded: (text: string, filename: string) => void;
  maxBytes?: number;
};

export function UploadDropzone({ onLoaded, maxBytes = DEFAULT_MAX }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const consumeFile = useCallback(
    (f: File) => {
      setErr(null);
      if (f.size > maxBytes) {
        setErr(`파일이 너무 큽니다. ${(maxBytes / (1024 * 1024)).toFixed(1)} MiB 이하만 지원합니다.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const text = typeof reader.result === "string" ? reader.result : "";
        if (!text.trim()) {
          setErr("빈 파일입니다.");
          return;
        }
        onLoaded(text, f.name);
      };
      reader.onerror = () => setErr("파일을 읽을 수 없습니다.");
      reader.readAsText(f, "UTF-8");
    },
    [maxBytes, onLoaded],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>1. CSV 업로드</CardTitle>
        <CardDescription>UTF-8 CSV를 드래그하거나 선택하세요. 서버 제한에 맞춰 약 4MB 이하를 권장합니다.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const f = e.dataTransfer.files?.[0];
            if (f) consumeFile(f);
          }}
          className={`flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-4 py-8 text-center transition-colors ${
            drag ? "border-sky-400 bg-sky-950/30" : "border-slate-700 bg-slate-950/40"
          }`}
        >
          <p className="text-sm text-slate-300">여기에 파일을 놓거나</p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) consumeFile(f);
            }}
          />
          <Button type="button" variant="default" className="mt-3" onClick={() => fileRef.current?.click()}>
            파일 선택
          </Button>
        </div>
        {err ? <p className="text-sm text-rose-400">{err}</p> : null}
      </CardContent>
    </Card>
  );
}
