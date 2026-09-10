"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

export interface PrimaryActionConfig {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  /** Material Symbols icon name — defaults to a forward arrow. */
  icon?: string;
}

interface PrimaryActionContextValue {
  action: PrimaryActionConfig | null;
  setAction: (a: PrimaryActionConfig | null) => void;
}

const PrimaryActionContext = createContext<PrimaryActionContextValue | null>(null);

/** Wraps the booking window's content once (in AppShell) — every screen's primary "continue"
 * CTA registers into this instead of rendering its own inline/fixed button, so exactly one
 * floating action button is ever shown, consistently positioned, regardless of which screen
 * is active or how tall its content is. */
export function PrimaryActionProvider({ children }: { children: React.ReactNode }) {
  const [action, setAction] = useState<PrimaryActionConfig | null>(null);
  return (
    <PrimaryActionContext.Provider value={{ action, setAction }}>
      {children}
    </PrimaryActionContext.Provider>
  );
}

function usePrimaryActionContext(): PrimaryActionContextValue {
  const ctx = useContext(PrimaryActionContext);
  if (!ctx) throw new Error("PrimaryAction hooks must be used within PrimaryActionProvider");
  return ctx;
}

/** Registers this screen's primary "continue" CTA as the floating action button. Pass `null`
 * (or omit while a condition is false) to show no floating button at all — e.g. while a list is
 * empty. Automatically unregisters on unmount, so navigating to a screen with no CTA of its own
 * never leaves a stale button floating. */
export function usePrimaryAction(config: PrimaryActionConfig | null): void {
  const { setAction } = usePrimaryActionContext();
  const onClickRef = useRef(config?.onClick);
  onClickRef.current = config?.onClick;

  const active = config !== null;
  const label = config?.label;
  const disabled = config?.disabled;
  const loading = config?.loading;
  const icon = config?.icon;

  useEffect(() => {
    if (!active) {
      setAction(null);
      return;
    }
    setAction({
      label: label!,
      disabled,
      loading,
      icon,
      onClick: () => onClickRef.current?.(),
    });
    // onClick is intentionally excluded — it's threaded through a stable ref above so a fresh
    // closure every render (near-guaranteed for an inline arrow function) never re-triggers
    // this effect, which would otherwise re-set context state every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, label, disabled, loading, icon, setAction]);

  useEffect(() => {
    return () => setAction(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/** Rendered once by AppShell — the actual floating button, reading whatever the active screen
 * has registered. */
export function FloatingPrimaryAction() {
  const { action } = usePrimaryActionContext();
  if (!action) return null;

  return (
    <div className="pointer-events-none absolute bottom-16 right-4 z-30 sm:bottom-20 sm:right-6">
      <button
        disabled={action.disabled || action.loading}
        onClick={action.onClick}
        className="pointer-events-auto flex h-14 items-center gap-space-sm rounded-full bg-secondary px-space-xl font-label-lg text-label-lg text-on-secondary shadow-rlap-2 transition-all hover:-translate-y-0.5 hover:bg-secondary/90 active:translate-y-0 disabled:cursor-not-allowed disabled:translate-y-0 disabled:bg-surface-dim disabled:text-on-surface-variant disabled:shadow-none"
      >
        <span>{action.loading ? "Please wait…" : action.label}</span>
        <span className="material-symbols-outlined text-[20px]">{action.icon ?? "arrow_forward"}</span>
      </button>
    </div>
  );
}
