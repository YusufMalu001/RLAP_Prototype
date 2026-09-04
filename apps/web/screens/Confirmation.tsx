"use client";

import { useEffect, useState } from "react";
import { Button } from "../components/Button";
import { ScreenShell } from "../components/ScreenShell";
import { api } from "../lib/apiClient";
import { useWidgetStore } from "../lib/store";
import type { BookingDetail } from "../lib/types";

/** SC8 — Booking Confirmation. */
export function Confirmation() {
  const bookingId = useWidgetStore((s) => s.bookingId);
  const bookingCode = useWidgetStore((s) => s.bookingCode);
  const reset = useWidgetStore((s) => s.reset);
  const pendingSecondCartToken = useWidgetStore((s) => s.pendingSecondCartToken);
  const continueWithSecondCart = useWidgetStore((s) => s.continueWithSecondCart);
  const [detail, setDetail] = useState<BookingDetail | null>(null);

  useEffect(() => {
    if (!bookingId) return;
    api
      .getBooking(bookingId)
      .then(setDetail)
      .catch(() => setDetail(null));
  }, [bookingId]);

  return (
    <ScreenShell title="Booking Confirmed" showBack={false}>
      <div className="flex flex-col items-center py-6 text-center">
        <span className="mb-3 text-4xl">✅</span>
        <p className="mb-1 text-sm text-slate-500">Booking ID</p>
        <p className="mb-6 text-lg font-bold tracking-wide text-slate-900">{bookingCode}</p>

        {detail ? (
          <div className="w-full space-y-3 rounded-2xl bg-slate-50 p-4 text-left">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {detail.collectionMode === "HOME_COLLECTION" ? "Servicing Centre" : "Centre"}
              </p>
              <p className="text-sm text-slate-700">{detail.centre.name}</p>
            </div>
            {detail.schedule.map((slot, i) => (
              <div key={i}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {slot.type === "LAB"
                    ? "Lab Draw"
                    : slot.type === "HOME_COLLECTION_WINDOW"
                      ? "Collection Window"
                      : "Scan"}
                </p>
                <p className="text-sm text-slate-700">
                  {slot.date} · {slot.startTime}–{slot.endTime}
                </p>
              </div>
            ))}
            {detail.lineItems.some((item) => item.preparationInstructions) ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Reminders
                </p>
                {detail.lineItems
                  .filter((item) => item.preparationInstructions)
                  .map((item) => (
                    <p key={item.id} className="text-sm text-slate-700">
                      {item.name}: {item.preparationInstructions}
                    </p>
                  ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <p className="mt-6 text-xs text-slate-400">
          Confirmation sent to +91 {detail?.patient.mobileNumber}
        </p>

        <div className="mt-8 w-full space-y-2">
          {pendingSecondCartToken ? (
            <Button onClick={() => void continueWithSecondCart()}>
              Continue With Your Lab Tests
            </Button>
          ) : null}
          <Button variant="secondary" onClick={() => reset()}>
            Book Another Appointment
          </Button>
        </div>
      </div>
    </ScreenShell>
  );
}
