import { forwardRef, type ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "ghost";
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Btn(
  { className = "", variant = "default", disabled, ...rest },
  ref,
) {
  const base =
    "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 disabled:pointer-events-none disabled:opacity-50";
  const styles =
    variant === "ghost"
      ? "bg-transparent text-slate-200 hover:bg-slate-800"
      : "bg-sky-600 text-white hover:bg-sky-500 shadow-sm shadow-sky-950/40";
  return <button ref={ref} disabled={disabled} className={`${base} ${styles} ${className}`} {...rest} />;
});
