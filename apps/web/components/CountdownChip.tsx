"use client";

import { useEffect, useState } from "react";
import { useWidgetStore } from "../lib/store";

function formatMMSS(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Visible from slot-hold onward through checkout (§4.2 R9/L7/C5/SC4) — ticks locally, resyncs via poll. */
export function CountdownChip() {
  const remaining = useWidgetStore((s) => s.holdRemainingSeconds);
  const expired = useWidgetStore((s) => s.holdExpired);
  // Once a booking exists, the hold has already been converted to a real BookingSlot (or
  // never mattered, for a reception booking) — "Slot held" would be actively misleading here.
  const bookingId = useWidgetStore((s) => s.bookingId);
  const pollHoldStatus = useWidgetStore((s) => s.pollHoldStatus);
  const [localSeconds, setLocalSeconds] = useState(remaining);

  useEffect(() => setLocalSeconds(remaining), [remaining]);

  const hasHold = remaining !== null;
  useEffect(() => {
    if (!hasHold) return;
    const tick = setInterval(
      () => setLocalSeconds((prev) => (prev !== null ? Math.max(0, prev - 1) : prev)),
      1000,
    );
    return () => clearInterval(tick);
  }, [hasHold]);

  useEffect(() => {
    if (bookingId) return;
    const poll = setInterval(() => void pollHoldStatus(), 15000);
    return () => clearInterval(poll);
  }, [pollHoldStatus, bookingId]);

  if (bookingId) return null;
  if (remaining === null && !expired) return null;

  if (expired) {
    return (
      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
        Hold expired
      </span>
    );
  }

  const seconds = localSeconds ?? remaining ?? 0;
  const low = seconds < 120;

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${low ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}
    >
      Slot held · {formatMMSS(seconds)}
    </span>
  );
}
