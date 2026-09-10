"use client";

import { Breadcrumb } from "../components/AppHeader";
import { usePrimaryAction } from "../components/PrimaryAction";
import { useWidgetStore } from "../lib/store";

/** SC6 — Booking Summary & Payment Method. Pay at Reception hidden entirely unless every item is eligible. */
export function BookingSummary() {
  const summary = useWidgetStore((s) => s.summary);
  const confirmBooking = useWidgetStore((s) => s.confirmBooking);
  const loading = useWidgetStore((s) => s.loading);

  if (!summary) {
    usePrimaryAction(null);
    return (
      <>
        <Breadcrumb section="Checkout" step="Booking Summary" />
        <p className="py-8 text-center font-body-md text-body-md text-on-surface-variant">Loading summary…</p>
      </>
    );
  }

  const isCombined = summary.schedule.length > 1;
  const orderRef = `#RLAP-${Math.random().toString(36).slice(2, 9).toUpperCase()}`;

  usePrimaryAction({
    label: `Pay Online Now (₹${summary.total})`,
    onClick: () => void confirmBooking("ONLINE"),
    disabled: loading,
  });

  return (
    <>
      <Breadcrumb section="Checkout" step="Booking Summary" sessionLabel="Final Booking Review" />
      <div className="grid w-full grid-cols-1 items-start gap-space-xl lg:grid-cols-12">
        {/* Left: order review */}
        <div className="flex flex-col gap-space-lg lg:col-span-7">
          <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest shadow-md">
            <div className="h-2 w-full bg-gradient-to-r from-primary-container via-secondary to-primary-container" />
            <div className="flex flex-col gap-space-lg p-card-pad-lg">
              <div className="flex flex-col justify-between gap-space-md pb-space-md sm:flex-row sm:items-start">
                <div className="flex items-start gap-space-md">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-container-low text-primary-container shadow-sm">
                    <span className="material-symbols-outlined text-[28px]">medical_services</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-caption text-caption font-bold uppercase tracking-wider text-primary">
                      RLAP Diagnostics
                    </span>
                    <h2 className="font-title-md text-title-md text-primary">Booking Summary</h2>
                    <span className="mt-0.5 font-caption text-caption text-outline">
                      Order Ref: <span className="font-semibold text-on-surface">{orderRef}</span>
                    </span>
                  </div>
                </div>
              </div>

              {summary.patientName ? (
                <div className="flex flex-col items-start justify-between gap-space-md rounded-lg bg-surface-container-low/70 p-card-pad-md sm:flex-row sm:items-center">
                  <div className="flex items-center gap-space-sm">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container font-label-lg text-label-lg text-on-primary">
                      {summary.patientName
                        .split(/\s+/)
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </div>
                    <span className="font-label-lg text-label-lg font-semibold text-primary">
                      {summary.patientName}
                    </span>
                  </div>
                </div>
              ) : null}

              {summary.centre ? (
                <div className="flex flex-col gap-space-md rounded-lg bg-surface-container-low p-card-pad-md">
                  <div className="flex items-center gap-space-xs text-primary">
                    <span className="material-symbols-outlined text-[20px] text-secondary">location_on</span>
                    <span className="font-label-lg text-label-lg font-semibold text-primary">
                      {summary.homeCollectionCharge != null ? "Servicing Centre" : summary.centre.name}
                    </span>
                  </div>
                  <span className="pl-space-lg font-caption text-caption text-on-surface-variant">
                    {summary.centre.address}
                  </span>
                </div>
              ) : null}

              <div className="flex flex-col gap-space-sm pt-space-xs">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md uppercase tracking-wider text-outline">
                    {isCombined ? "Appointments" : "Appointment"}
                  </span>
                  <span className="font-caption text-caption text-on-surface-variant">
                    {summary.schedule.length} slot{summary.schedule.length > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex flex-col gap-space-xs">
                  {summary.schedule.map((slot, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg bg-surface-container-low/40 p-space-sm"
                    >
                      <div className="flex items-center gap-space-sm">
                        <span className="material-symbols-outlined text-[18px] text-primary-container">
                          {slot.type === "HOME_COLLECTION_WINDOW"
                            ? "home"
                            : slot.type === "LAB"
                              ? "biotech"
                              : "radiology"}
                        </span>
                        <span className="font-body-md text-body-md text-on-surface">
                          {slot.type === "HOME_COLLECTION_WINDOW"
                            ? "Collection window"
                            : slot.type === "LAB"
                              ? "Lab draw"
                              : "Scan"}
                        </span>
                      </div>
                      <span className="font-label-md text-label-md text-primary">
                        {slot.date} · {slot.startTime}–{slot.endTime}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-space-sm pt-space-xs">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md uppercase tracking-wider text-outline">
                    Services
                  </span>
                  <span className="font-caption text-caption text-on-surface-variant">
                    {summary.items.length} item{summary.items.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex flex-col gap-space-xs">
                  {summary.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg bg-surface-container-low/40 p-space-sm"
                    >
                      <span className="font-body-md text-body-md text-on-surface">{item.name}</span>
                      <span className="font-label-lg text-label-lg font-semibold text-primary">₹{item.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-space-xs rounded-lg bg-surface-container-low p-card-pad-md">
                <div className="flex items-center justify-between">
                  <span className="font-body-md text-body-md text-on-surface-variant">Subtotal</span>
                  <span className="font-label-lg text-label-lg text-on-surface">
                    ₹{summary.subtotal - (summary.homeCollectionCharge ?? 0)}
                  </span>
                </div>
                {summary.homeCollectionCharge ? (
                  <div className="flex items-center justify-between">
                    <span className="font-body-md text-body-md text-on-surface-variant">Home Collection Charge</span>
                    <span className="font-label-lg text-label-lg text-on-surface">
                      ₹{summary.homeCollectionCharge}
                    </span>
                  </div>
                ) : null}
                <div className="mt-space-xs flex items-baseline justify-between pt-space-xs">
                  <div className="flex flex-col">
                    <span className="font-headline-sm text-headline-sm font-bold text-primary">Total Payable</span>
                    <span className="font-caption text-caption text-on-surface-variant">
                      Inclusive of all facility surcharges &amp; tax
                    </span>
                  </div>
                  <span className="font-display-lg text-display-lg font-bold tracking-tight text-primary">
                    ₹{summary.total}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: payment CTA */}
        <div className="flex flex-col gap-space-lg lg:col-span-5">
          <div className="flex flex-col gap-space-lg rounded-xl bg-surface-container-lowest p-card-pad-lg shadow-md">
            <div className="flex flex-col">
              <span className="font-caption text-caption font-bold uppercase tracking-wider text-secondary">
                Checkout Finalization
              </span>
              <h3 className="font-headline-sm text-headline-sm text-primary">Select Payment Preference</h3>
              <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
                Choose between instant priority online booking or settling upon arrival.
              </p>
            </div>

            <div className="flex flex-col gap-space-md">
              {summary.payAtReceptionEligible ? (
                <div className="flex flex-col items-center gap-space-xs pt-space-xs text-center">
                  <button
                    disabled={loading}
                    onClick={() => void confirmBooking("PAY_AT_RECEPTION")}
                    className="font-label-md text-label-md text-primary-container underline decoration-primary-container/30 underline-offset-4 transition-colors hover:text-secondary hover:decoration-secondary disabled:opacity-50"
                  >
                    or Pay at Reception during check-in
                  </button>
                  <span className="max-w-[280px] font-caption text-caption text-on-surface-variant">
                    Zero cancellation penalty up to 2 hours prior to your scheduled slot.
                  </span>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-space-sm pt-space-sm">
              <span className="text-center font-caption text-caption uppercase tracking-wider text-outline">
                RLAP Medical Concierge Standard
              </span>
              <div className="grid grid-cols-3 gap-space-xs text-center">
                {[
                  ["verified", "ISO 15189", "Accredited"],
                  ["shield", "NABL Lab", "Certified"],
                  ["lock", "256-Bit SSL", "Gateway"],
                ].map(([icon, title, subtitle]) => (
                  <div
                    key={title}
                    className="flex flex-col items-center justify-center gap-1 rounded-lg bg-surface-container-low p-space-xs"
                  >
                    <span className="material-symbols-outlined text-[20px] text-primary-container">{icon}</span>
                    <span className="font-caption text-caption font-semibold leading-tight text-primary">
                      {title}
                    </span>
                    <span className="font-caption text-[11px] leading-none text-outline">{subtitle}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-space-md rounded-xl bg-surface-container-lowest p-card-pad-md shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary">
              <span className="material-symbols-outlined text-[22px]">support_agent</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-md text-label-md font-semibold text-primary">
                Have doctor instructions or doubts?
              </span>
              <span className="font-caption text-caption text-on-surface-variant">
                Call triage support: <span className="font-semibold text-primary">1800-420-RLAP</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
