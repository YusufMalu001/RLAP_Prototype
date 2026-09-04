"use client";

import { Button } from "../components/Button";
import { ScreenShell } from "../components/ScreenShell";
import { useWidgetStore } from "../lib/store";

/** SC6 — Booking Summary & Payment Method. Pay at Reception hidden entirely unless every item is eligible. */
export function BookingSummary() {
  const summary = useWidgetStore((s) => s.summary);
  const confirmBooking = useWidgetStore((s) => s.confirmBooking);
  const loading = useWidgetStore((s) => s.loading);

  if (!summary) {
    return (
      <ScreenShell title="Booking Summary">
        <p className="py-8 text-center text-sm text-slate-400">Loading summary…</p>
      </ScreenShell>
    );
  }

  const isCombined = summary.schedule.length > 1;

  return (
    <ScreenShell
      title="Booking Summary"
      footer={
        <div className="space-y-2">
          <Button loading={loading} onClick={() => void confirmBooking("ONLINE")}>
            Pay Online Now — ₹{summary.total}
          </Button>
          {summary.payAtReceptionEligible ? (
            <button
              disabled={loading}
              onClick={() => void confirmBooking("PAY_AT_RECEPTION")}
              className="w-full text-center text-xs font-medium text-slate-500 underline hover:text-slate-700"
            >
              Pay at Reception instead
            </button>
          ) : null}
        </div>
      }
    >
      <div className="space-y-4">
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Items
          </h2>
          <div className="space-y-1.5">
            {summary.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{item.name}</span>
                <span className="text-slate-500">₹{item.price}</span>
              </div>
            ))}
          </div>
        </section>

        {summary.centre ? (
          <section>
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {summary.homeCollectionCharge != null ? "Servicing Centre" : "Centre"}
            </h2>
            <p className="text-sm text-slate-700">{summary.centre.name}</p>
            <p className="text-xs text-slate-500">{summary.centre.address}</p>
          </section>
        ) : null}

        <section>
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {isCombined ? "Appointments" : "Appointment"}
          </h2>
          {summary.schedule.map((slot, i) => (
            <p key={i} className="text-sm text-slate-700">
              {slot.type === "HOME_COLLECTION_WINDOW"
                ? "Collection window"
                : slot.type === "LAB"
                  ? "Lab draw"
                  : "Scan"}
              : {slot.date} · {slot.startTime}–{slot.endTime}
            </p>
          ))}
        </section>

        {summary.patientName ? (
          <section>
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Patient
            </h2>
            <p className="text-sm text-slate-700">{summary.patientName}</p>
          </section>
        ) : null}

        <section className="space-y-1 border-t border-slate-100 pt-3 text-sm">
          <div className="flex justify-between text-slate-500">
            <span>Subtotal</span>
            <span>₹{summary.subtotal - (summary.homeCollectionCharge ?? 0)}</span>
          </div>
          {summary.homeCollectionCharge ? (
            <div className="flex justify-between text-slate-500">
              <span>Home Collection Charge</span>
              <span>₹{summary.homeCollectionCharge}</span>
            </div>
          ) : null}
          <div className="flex justify-between text-base font-semibold text-slate-900">
            <span>Total</span>
            <span>₹{summary.total}</span>
          </div>
        </section>
      </div>
    </ScreenShell>
  );
}
