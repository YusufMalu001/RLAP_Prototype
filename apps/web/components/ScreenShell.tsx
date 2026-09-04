"use client";

import type { ReactNode } from "react";
import { useWidgetStore } from "../lib/store";
import { CountdownChip } from "./CountdownChip";

interface ScreenShellProps {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  showBack?: boolean;
  onClose?: () => void;
}

/** The modal chrome every screen renders inside — header with Back/Close + hold countdown, footer for CTAs. */
export function ScreenShell({
  title,
  children,
  footer,
  showBack = true,
  onClose,
}: ScreenShellProps) {
  const goBack = useWidgetStore((s) => s.goBack);
  const history = useWidgetStore((s) => s.history);
  const error = useWidgetStore((s) => s.error);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-white sm:my-6 sm:min-h-[min(44rem,90vh)] sm:rounded-2xl sm:shadow-xl">
      <header className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          {showBack && history.length > 0 ? (
            <button
              onClick={goBack}
              aria-label="Back"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
            >
              ←
            </button>
          ) : null}
          <h1 className="truncate text-base font-semibold text-slate-900">{title}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <CountdownChip />
          {onClose ? (
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
            >
              ✕
            </button>
          ) : null}
        </div>
      </header>

      {error ? (
        <div className="mx-4 mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>

      {footer ? <footer className="border-t border-slate-100 px-4 py-3">{footer}</footer> : null}
    </div>
  );
}
