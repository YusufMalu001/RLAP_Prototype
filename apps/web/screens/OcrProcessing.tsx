"use client";

import { ScreenShell } from "../components/ScreenShell";

/** O2 — Processing State (transitional; no footer buttons). */
export function OcrProcessing() {
  return (
    <ScreenShell title="Reading your prescription…" showBack={false}>
      <div className="flex flex-col items-center py-12">
        <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        <p className="text-sm text-slate-500">This usually takes a few seconds…</p>
      </div>
    </ScreenShell>
  );
}
