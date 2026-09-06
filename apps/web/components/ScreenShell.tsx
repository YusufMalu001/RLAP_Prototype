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
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-rlap-surface sm:my-6 sm:min-h-[min(44rem,90vh)] sm:rounded-xl sm:shadow-rlap-2">
      <header className="flex items-center justify-between gap-2 border-b border-rlap-outline-variant bg-rlap-surface-bright px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          {showBack && history.length > 0 ? (
            <button
              onClick={goBack}
              aria-label="Back"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-rlap-on-surface-variant hover:bg-rlap-surface-container transition-colors"
            >
              ←
            </button>
          ) : null}
          <h1 className="truncate text-title-md font-semibold text-rlap-on-surface">{title}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <CountdownChip />
          {onClose ? (
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-rlap-on-surface-variant hover:bg-rlap-surface-container transition-colors"
            >
              ✕
            </button>
          ) : null}
        </div>
      </header>

      {error ? (
        <div className="mx-4 mt-3 rounded-lg border border-rlap-error bg-rlap-error/5 px-4 py-3 text-body-md text-rlap-error">
          {error}
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto px-4 py-5">{children}</div>

      {footer ? <footer className="border-t border-rlap-outline-variant bg-rlap-surface-bright px-4 py-4">{footer}</footer> : null}
    </div>
  );
}
