"use client";

import { ScreenShell } from "../components/ScreenShell";
import { useWidgetStore } from "../lib/store";

/** L4 — Sample Collection Type. */
export function LabCollectionType() {
  const navigate = useWidgetStore((s) => s.navigate);

  return (
    <ScreenShell title="How would you like your sample collected?">
      <div className="space-y-3">
        <button
          onClick={() => navigate("LAB_HOME_ADDRESS")}
          className="w-full rounded-2xl border border-slate-200 px-4 py-6 text-left hover:border-blue-300 hover:bg-blue-50"
        >
          <span className="block text-sm font-semibold text-slate-900">
            🏠 Home Sample Collection
          </span>
          <span className="mt-1 block text-xs text-slate-500">
            A technician visits you at a chosen time. A collection charge applies.
          </span>
        </button>
        <button
          onClick={() => navigate("LOCATION")}
          className="w-full rounded-2xl border border-slate-200 px-4 py-6 text-left hover:border-blue-300 hover:bg-blue-50"
        >
          <span className="block text-sm font-semibold text-slate-900">🏥 Visit the Centre</span>
          <span className="mt-1 block text-xs text-slate-500">
            Choose a nearby centre and appointment time.
          </span>
        </button>
      </div>
    </ScreenShell>
  );
}
