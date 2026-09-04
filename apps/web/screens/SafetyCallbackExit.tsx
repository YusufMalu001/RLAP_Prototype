"use client";

import { ScreenShell } from "../components/ScreenShell";
import { useWidgetStore } from "../lib/store";

/**
 * Dead-end reached when a safety-check answer is flagged (§4.2 R7/C3). Deliberately does not
 * offer a "Continue" — online confirmation is blocked; the patient is routed to a callback.
 */
export function SafetyCallbackExit() {
  const reset = useWidgetStore((s) => s.reset);

  return (
    <ScreenShell title="Let's talk it through" showBack={false}>
      <div className="flex flex-col items-center py-8 text-center">
        <span className="mb-3 text-3xl">📞</span>
        <p className="mb-2 text-sm font-semibold text-slate-800">
          For your safety, this booking needs a quick check with our team before it can be confirmed
          online.
        </p>
        <p className="mb-6 text-sm text-slate-500">
          One of our staff will call you shortly to confirm the details and complete your booking
          safely.
        </p>
        <button
          onClick={() => reset()}
          className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Start a New Booking
        </button>
      </div>
    </ScreenShell>
  );
}
