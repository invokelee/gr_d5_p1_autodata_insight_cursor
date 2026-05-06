import type { HTMLAttributes } from "react";

export function Badge({ className = "", ...p }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-slate-700 bg-slate-800/80 px-2.5 py-0.5 text-xs font-medium text-slate-200 ${className}`}
      {...p}
    />
  );
}
