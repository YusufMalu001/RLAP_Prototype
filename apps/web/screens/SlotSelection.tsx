"use client";

import { useEffect, useState } from "react";
import { Breadcrumb } from "../components/AppHeader";
import { useWidgetStore } from "../lib/store";
import type { SlotSummary } from "../lib/types";

function nextDays(count: number): string[] {
  return Array.from({ length: count }, (_, i) =>
    new Date(Date.now() + (i + 1) * 86400000).toISOString().slice(0, 10),
  );
}

function DateStrip({
  slotDate,
  setSlotDate,
}: {
  slotDate: string;
  setSlotDate: (date: string) => void;
}) {
  return (
    <div className="flex items-center gap-space-sm overflow-x-auto pb-space-xs pt-1 select-none">
      {nextDays(14).map((date) => {
        const active = date === slotDate;
        const d = new Date(date);
        return (
          <button
            key={date}
            onClick={() => setSlotDate(date)}
            className={`flex min-w-[120px] shrink-0 cursor-pointer flex-col items-start rounded-xl p-space-sm text-left shadow-sm transition-all ${
              active
                ? "bg-primary text-on-primary shadow-md"
                : "bg-surface-container-lowest text-on-surface hover:bg-surface-container"
            }`}
            type="button"
          >
            <span
              className={`font-caption text-caption text-[11px] font-semibold uppercase tracking-wider ${
                active ? "text-primary-fixed-dim" : "text-outline"
              }`}
            >
              {d.toLocaleDateString(undefined, { weekday: "short" })}
            </span>
            <span
              className={`mt-1 font-title-md text-title-md font-bold leading-tight ${
                active ? "text-on-primary" : "text-primary"
              }`}
            >
              {d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SlotGrid({
  label,
  icon,
  slots,
  selectedId,
  onSelect,
}: {
  label: string;
  icon: string;
  slots: SlotSummary[];
  selectedId: string | null;
  onSelect: (slot: SlotSummary) => void;
}) {
  return (
    <div className="flex flex-col gap-space-sm">
      <div className="flex items-center gap-space-xs">
        <span className="material-symbols-outlined text-[18px] text-outline">{icon}</span>
        <span className="font-label-lg text-label-lg font-bold text-primary">{label}</span>
      </div>
      {slots.length === 0 ? (
        <p className="font-body-md text-body-md text-on-surface-variant">
          No slots available this day.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-space-xs sm:grid-cols-3 md:grid-cols-5">
          {slots.map((slot) => {
            const full = slot.availableCapacity <= 0;
            const selected = selectedId === slot.id;
            return (
              <button
                key={slot.id}
                disabled={full}
                onClick={() => onSelect(slot)}
                className={`flex h-14 flex-col items-center justify-center rounded-lg font-label-md text-label-md font-semibold transition-all ${
                  selected
                    ? "scale-[1.02] bg-[#9e4a3b] text-white shadow-md shadow-secondary/30"
                    : full
                      ? "cursor-not-allowed bg-surface-container-low text-outline opacity-60"
                      : "bg-surface-container-lowest text-primary shadow-sm hover:bg-surface-container hover:shadow"
                }`}
                type="button"
              >
                <span className={full ? "line-through" : ""}>{slot.startTime}</span>
                {full ? (
                  <span className="font-caption text-[10px] font-medium text-outline">Full</span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
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
  const holdRemainingSeconds = useWidgetStore((s) => s.holdRemainingSeconds);

  const [radiologySlotId, setRadiologySlotId] = useState<string | null>(null);
  const [labSlotId, setLabSlotId] = useState<string | null>(null);

  const centreId = cart?.centreId;
  const cartType = cart?.cartType;
  const needsRadiology = cartType === "RADIOLOGY" || cartType === "COMBINED";
  const needsLab = cartType === "LAB" || cartType === "COMBINED";
  const isCombined = cartType === "COMBINED";

  useEffect(() => {
    if (!centreId) return;
    void loadSlots(centreId, slotDate);
  }, [centreId, slotDate, loadSlots]);

  // A stale local selection from before a lapse must never let Continue through — re-holding
  // (via a fresh onSelect click below) clears holdExpired again.
  const ready = !holdExpired && (!needsRadiology || radiologySlotId) && (!needsLab || labSlotId);

  const timerLabel =
    holdRemainingSeconds != null
      ? `${String(Math.floor(holdRemainingSeconds / 60)).padStart(2, "0")}:${String(
          holdRemainingSeconds % 60,
        ).padStart(2, "0")}`
      : null;

  return (
    <>
      <Breadcrumb section="Booking" step="Date & Time" sessionLabel="Step 4 of 4" />

      <div className="mb-space-lg flex flex-col gap-space-md rounded-xl bg-surface-container-lowest p-space-md shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col">
          <h1 className="font-headline-lg text-headline-lg tracking-tight text-primary">
            {isCombined ? "Schedule Your Combined Appointment" : "Select Date & Appointment Time"}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {isCombined
              ? "Select your preferred sequential times. We recommend scheduling lab collection 30–45 minutes prior to your scan."
              : "Choose a convenient slot at your selected centre."}
          </p>
        </div>
        {timerLabel ? (
          <div className="flex items-center gap-space-xs self-start rounded-full bg-secondary-fixed/50 px-space-md py-1.5 md:self-auto">
            <span className="material-symbols-outlined animate-pulse text-[18px] text-secondary">
              timer
            </span>
            <span className="font-caption text-caption text-[12px] font-medium text-on-secondary-fixed-variant">
              Temporary Hold:
            </span>
            <span className="font-label-md text-label-md font-bold tracking-tight text-secondary">
              {timerLabel}
            </span>
          </div>
        ) : null}
      </div>

      {holdExpired ? (
        <div className="mb-space-md flex items-center gap-space-sm rounded-lg bg-error-container/60 p-space-sm text-on-error-container">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span className="font-label-md text-label-md">
            Your slot hold has expired — please reselect a time.
          </span>
        </div>
      ) : null}

      <div className="mb-space-xs flex flex-col gap-space-xs">
        <span className="font-label-md text-label-md font-semibold text-on-surface">
          Select a date
        </span>
        <DateStrip slotDate={slotDate} setSlotDate={setSlotDate} />
      </div>

      {slotsLoading ? (
        <p className="py-space-lg text-center font-body-md text-body-md text-on-surface-variant">
          Loading available times…
        </p>
      ) : isCombined ? (
        <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-2">
          <section className="flex flex-col gap-space-md rounded-xl bg-surface-container-lowest p-card-pad-lg shadow-sm">
            <div className="flex items-center gap-space-sm">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-container font-label-md text-label-md text-on-primary">
                1
              </span>
              <h2 className="font-title-md text-title-md text-primary">Lab Draw</h2>
            </div>
            <SlotGrid
              label="Available Times"
              icon="wb_twilight"
              slots={slots?.lab ?? []}
              selectedId={labSlotId}
              onSelect={(slot) => {
                setLabSlotId(slot.id);
                void holdSlotAction(slot.id);
              }}
            />
          </section>
          <section className="flex flex-col gap-space-md rounded-xl bg-surface-container-lowest p-card-pad-lg shadow-sm">
            <div className="flex items-center gap-space-sm">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-container font-label-md text-label-md text-on-primary">
                2
              </span>
              <h2 className="font-title-md text-title-md text-primary">Scan</h2>
            </div>
            <SlotGrid
              label="Available Times"
              icon="light_mode"
              slots={slots?.radiology ?? []}
              selectedId={radiologySlotId}
              onSelect={(slot) => {
                setRadiologySlotId(slot.id);
                void holdSlotAction(slot.id);
              }}
            />
          </section>
        </div>
      ) : (
        <div className="flex flex-col gap-space-lg rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
          {needsRadiology ? (
            <SlotGrid
              label="Time"
              icon="wb_twilight"
              slots={slots?.radiology ?? []}
              selectedId={radiologySlotId}
              onSelect={(slot) => {
                setRadiologySlotId(slot.id);
                void holdSlotAction(slot.id);
              }}
            />
          ) : null}
          {needsLab ? (
            <SlotGrid
              label={cart?.collectionMode === "HOME_COLLECTION" ? "Collection Window" : "Time"}
              icon="light_mode"
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

      <div className="mt-space-lg flex flex-col items-center gap-space-sm sm:flex-row sm:justify-end">
        <button
          disabled={!ready || loading}
          onClick={() => navigate("OTP_VERIFICATION")}
          className="flex min-h-[52px] w-full items-center justify-center gap-space-xs rounded-xl bg-[#9e4a3b] px-space-xl font-label-lg text-label-lg font-bold text-white shadow-md shadow-[#9e4a3b]/30 transition-all hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          type="button"
        >
          <span>{loading ? "Holding…" : "Confirm Slot & Continue"}</span>
          <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
        </button>
      </div>
    </>
  );
}
