"use client";

import { Button } from "../components/Button";
import { ScreenShell } from "../components/ScreenShell";
import { useWidgetStore } from "../lib/store";

/** R8 / L6 / C4 — Preparation Instructions, shown after centre selection, before slot selection. */
export function PreparationInstructions() {
  const preparation = useWidgetStore((s) => s.preparation);
  const navigate = useWidgetStore((s) => s.navigate);

  const hasRadiology = (preparation?.radiology.length ?? 0) > 0;
  const hasLab = (preparation?.lab.length ?? 0) > 0;
  const isCombined = hasRadiology && hasLab;

  return (
    <ScreenShell
      title="Before you arrive"
      footer={<Button onClick={() => navigate("SLOT_SELECTION")}>Continue</Button>}
    >
      <div className="space-y-4">
        {hasRadiology ? (
          <section>
            {isCombined ? (
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                For your Scan
              </h2>
            ) : null}
            <div className="space-y-2">
              {preparation!.radiology.map((entry) => (
                <div key={entry.id} className="rounded-xl bg-blue-50 px-4 py-3">
                  <p className="text-sm font-medium text-blue-900">{entry.name}</p>
                  <p className="text-sm text-blue-700">
                    {entry.preparationInstructions ?? "No special preparation required."}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {hasLab ? (
          <section>
            {isCombined ? (
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                For your Lab Test
              </h2>
            ) : null}
            <div className="space-y-2">
              {preparation!.lab.map((entry) => (
                <div key={entry.id} className="rounded-xl bg-emerald-50 px-4 py-3">
                  <p className="text-sm font-medium text-emerald-900">{entry.name}</p>
                  <p className="text-sm text-emerald-700">
                    {entry.preparationInstructions ?? "No special preparation required."}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {!hasRadiology && !hasLab ? (
          <p className="text-sm text-slate-400">No special preparation required.</p>
        ) : null}
      </div>
    </ScreenShell>
  );
}
