"use client";

import { Button } from "../components/Button";
import { ScreenShell } from "../components/ScreenShell";
import { useWidgetStore } from "../lib/store";

/** O4 — OCR Failure Fallback, on total OCR failure only (low-confidence is handled inline in the cart). */
export function OcrFailure() {
  const navigate = useWidgetStore((s) => s.navigate);

  return (
    <ScreenShell title="Upload didn't work">
      <div className="flex flex-col items-center py-8 text-center">
        <span className="mb-3 text-3xl">🤔</span>
        <p className="mb-1 text-sm font-semibold text-slate-800">
          We couldn&apos;t quite read that prescription
        </p>
        <p className="mb-6 text-sm text-slate-500">
          No problem — you can search manually or try another photo.
        </p>
        <div className="w-full space-y-2">
          <Button onClick={() => navigate("HOME")}>Search Manually</Button>
          <Button variant="secondary" onClick={() => navigate("UPLOAD_PRESCRIPTION")}>
            Try Uploading Again
          </Button>
        </div>
      </div>
    </ScreenShell>
  );
}
