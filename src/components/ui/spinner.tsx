export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-sky-400 ${className}`}
      role="status"
      aria-label="로딩"
    />
  );
}
