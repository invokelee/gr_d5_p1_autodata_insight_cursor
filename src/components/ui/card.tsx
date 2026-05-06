import type { HTMLAttributes } from "react";

export function Card({ className = "", ...p }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-xl border border-slate-800 bg-slate-900/60 shadow-lg shadow-black/30 backdrop-blur-sm ${className}`}
      {...p}
    />
  );
}

export function CardHeader({ className = "", ...p }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`border-b border-slate-800 px-5 py-4 ${className}`} {...p} />;
}

export function CardTitle({ className = "", ...p }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={`text-base font-semibold tracking-tight text-slate-100 ${className}`} {...p} />;
}

export function CardDescription({ className = "", ...p }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`mt-1 text-sm text-slate-400 ${className}`} {...p} />;
}

export function CardContent({ className = "", ...p }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`px-5 py-4 ${className}`} {...p} />;
}
