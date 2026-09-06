"use client";

import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-rlap-secondary-light text-white hover:bg-rlap-secondary disabled:bg-rlap-surface-dim shadow-rlap-1 active:shadow-none",
  secondary: "bg-white text-rlap-primary-container border-2 border-rlap-primary-container hover:bg-rlap-surface-container disabled:opacity-50",
  ghost: "bg-transparent text-rlap-primary-container hover:bg-rlap-surface-container",
  danger: "bg-rlap-error text-white hover:bg-rlap-error/90 disabled:bg-rlap-surface-dim",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  loading,
  disabled,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`w-full rounded-lg px-4 py-3 text-label-lg font-semibold transition-all disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? "Please wait…" : children}
    </button>
  );
}
