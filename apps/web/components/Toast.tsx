"use client";

import { useEffect } from "react";
import { useWidgetStore } from "../lib/store";

/** Global error toast — auto-dismisses, replaces the old inline red banner every screen used to
 * render individually. Mounted once in AppShell so it floats above whichever screen is active. */
export function Toast() {
  const error = useWidgetStore((s) => s.error);
  const setError = useWidgetStore((s) => s.setError);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(timer);
  }, [error, setError]);

  if (!error) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-4">
      <div
        role="alert"
        className="pointer-events-auto flex w-full max-w-md items-start gap-space-sm rounded-lg border border-error bg-surface-container-lowest px-space-md py-space-sm shadow-rlap-2"
      >
        <span className="material-symbols-outlined mt-0.5 shrink-0 text-[20px] text-error">
          error
        </span>
        <p className="flex-1 font-body-md text-body-md text-on-surface">{error}</p>
        <button
          onClick={() => setError(null)}
          aria-label="Dismiss"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
    </div>
  );
}
