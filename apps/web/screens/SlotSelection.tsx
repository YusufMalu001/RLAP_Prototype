"use client";

import { useEffect, useState } from "react";
import { Button } from "../components/Button";
import { ScreenShell } from "../components/ScreenShell";
import { useWidgetStore } from "../lib/store";
import type { SlotSummary } from "../lib/types";

function nextDays(count: number): string[] {
  return Array.from({ length: count }, (_, i) =>
    new Date(Date.now() + (i + 1) * 86400000).toISOString().slice(0, 10),
  );
}

function SlotPicker({
  label,
  slots,
  selectedId,
  onSelect,
}: {
  label: string;
  slots: SlotSummary[];
  selectedId: string | null;
  onSelect: (slot: SlotSummary) => void;
}) {
  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</h2>
      {slots.length === 0 ? (
        <p className="text-sm text-slate-400">No slots available this day.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {slots.map((slot) => {
            const full = slot.availableCapacity <= 0;
            return (
              <button
                key={slot.id}
                disabled={full}
                onClick={() => onSelect(slot)}
                className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                  selectedId === slot.id
                    ? "border-blue-600 bg-blue-600 text-white"
                    : full
                      ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
                      : "border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                }`}
              >
                {slot.startTime}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

/** R9 / L7 / C5 — Slot Selection: one picker for single-service, two independent pickers for Combined. */
export function SlotSelection() {
  const cart = useWidgetStore((s) => s.cart);
  const slots = useWidgetStore((s) => s.slots);
  const slotsLoading = useWidgetStore((s) => s.slotsLoading);
  const slotDate = useWidgetStore((s) => s.slotDate);
  const setSlotDate = useWidgetStore((s) => s.setSlotDate);
  const loadSlots = useWidgetStore((s) => s.loadSlots);
  const holdSlotAction = useWidgetStore((s) => s.holdSlot);
  const loading = useWidgetStore((s) => s.loading);
  const navigate = useWidgetStore((s) => s.navigate);
  const holdExpired = useWidgetStore((s) => s.holdExpired);

  const [radiologySlotId, setRadiologySlotId] = useState<string | null>(null);
  const [labSlotId, setLabSlotId] = useState<string | null>(null);

  const centreId = cart?.centreId;
  const cartType = cart?.cartType;
  const needsRadiology = cartType === "RADIOLOGY" || cartType === "COMBINED";
  const needsLab = cartType === "LAB" || cartType === "COMBINED";

  useEffect(() => {
    if (!centreId) return;
    void loadSlots(centreId, slotDate);
  }, [centreId, slotDate, loadSlots]);

  // A stale local selection from before a lapse must never let Continue through — re-holding
  // (via a fresh onSelect click below) clears holdExpired again.
  const ready = !holdExpired && (!needsRadiology || radiologySlotId) && (!needsLab || labSlotId);

  return (
    <ScreenShell
      title="Choose a time"
      footer={
        <Button disabled={!ready} loading={loading} onClick={() => navigate("OTP_VERIFICATION")}>
          Continue
        </Button>
      }
    >
      <label className="mb-1 block text-xs font-medium text-slate-500">Date</label>
      <select
        value={slotDate}
        onChange={(e) => setSlotDate(e.target.value)}
        className="mb-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
      >
        {nextDays(14).map((date) => (
          <option key={date} value={date}>
            {new Date(date).toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </option>
        ))}
      </select>

      {slotsLoading ? (
        <p className="text-sm text-slate-400">Loading available times…</p>
      ) : (
        <div className="space-y-5">
          {needsRadiology ? (
            <SlotPicker
              label={cartType === "COMBINED" ? "Scan" : "Time"}
              slots={slots?.radiology ?? []}
              selectedId={radiologySlotId}
              onSelect={(slot) => {
                setRadiologySlotId(slot.id);
                void holdSlotAction(slot.id);
              }}
            />
          ) : null}
          {needsLab ? (
            <SlotPicker
              label={
                cartType === "COMBINED"
                  ? "Lab Draw"
                  : cart?.collectionMode === "HOME_COLLECTION"
                    ? "Collection Window"
                    : "Time"
              }
              slots={slots?.lab ?? []}
              selectedId={labSlotId}
              onSelect={(slot) => {
                setLabSlotId(slot.id);
                void holdSlotAction(slot.id);
              }}
            />
          ) : null}
        </div>
      )}
    </ScreenShell>
  );
}
