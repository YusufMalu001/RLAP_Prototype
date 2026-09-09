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
    primary:
      "bg-rlap-secondary-light text-white hover:bg-rlap-secondary disabled:bg-rlap-surface-dim shadow-rlap-1",
    secondary:
      "bg-white text-rlap-primary-container border-2 border-rlap-primary-container hover:bg-rlap-surface-container",
    danger: "bg-rlap-error text-white hover:bg-rlap-error/90 disabled:bg-rlap-surface-dim",
  }[variant];

  return (
    <button
      {...props}
      className={`rounded-md px-3 py-1.5 text-label-md font-semibold transition-colors disabled:cursor-not-allowed ${styles} ${className}`}
    >
      {children}
    </button>
  );
}
