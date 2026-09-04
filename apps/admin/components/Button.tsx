"use client";

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
}) {
  const styles = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-300",
    secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50",
    danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-slate-300",
  }[variant];

  return (
    <button
      {...props}
      className={`rounded-lg px-3 py-1.5 text-sm font-semibold disabled:cursor-not-allowed ${styles} ${className}`}
    >
      {children}
    </button>
  );
}
