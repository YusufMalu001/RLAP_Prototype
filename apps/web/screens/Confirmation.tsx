"use client";

import { useEffect, useState } from "react";
import { Breadcrumb } from "../components/AppHeader";
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

  const initials = (detail?.patient.name ?? "")
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      <Breadcrumb section="Booking" step="Confirmation" />

      <section className="relative mb-space-xl overflow-hidden rounded-xl bg-surface-container-lowest p-space-lg shadow-rlap-1 md:p-space-2xl">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary-fixed/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-secondary-fixed/30 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between gap-space-xl md:flex-row md:items-center">
          <div className="flex items-start gap-space-lg md:items-center">
            <div className="relative shrink-0">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-fixed shadow-[0_8px_20px_rgba(22,59,72,0.12)]">
                <span className="material-symbols-outlined text-[32px] text-primary">check_circle</span>
              </div>
              <span className="absolute -right-1 -top-1 flex h-4 w-4">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75" />
                <span className="relative inline-flex h-4 w-4 rounded-full bg-secondary" />
              </span>
            </div>
            <div className="flex flex-col gap-space-2xs">
              <div className="inline-flex w-fit items-center gap-space-xs rounded-full bg-surface-container px-space-sm py-space-2xs font-caption text-caption uppercase tracking-wider text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                Appointment Confirmed
              </div>
              <h1 className="font-headline-lg text-headline-lg tracking-tight text-primary">
                Your Diagnostic Appointment is Scheduled
              </h1>
              <p className="font-body-lg max-w-2xl text-body-lg text-on-surface-variant">
                We look forward to welcoming you. All clinical preparations and imaging suites are reserved in your
                name.
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-space-xl flex flex-col justify-between gap-space-md rounded-xl bg-surface-container-low/70 p-space-md md:flex-row md:items-center">
          <div className="flex flex-wrap items-center gap-space-md">
            <div className="flex items-center gap-space-xs">
              <span className="font-caption text-caption uppercase tracking-wider text-on-surface-variant">
                Booking Reference:
              </span>
              <span className="font-label-lg text-label-lg font-mono tracking-tight text-primary">
                {bookingCode}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-space-xs font-caption text-caption text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px] text-secondary">notifications_active</span>
            <span>
              SMS sent to <strong>+91 {detail?.patient.mobileNumber}</strong>
            </span>
          </div>
        </div>
      </section>

      <div className="grid w-full grid-cols-1 gap-gutter-desktop lg:grid-cols-12">
        {/* Left: timeline */}
        <div className="flex flex-col gap-space-xl lg:col-span-8">
          {detail ? (
            <div className="rounded-xl bg-surface-container-lowest p-space-lg shadow-[0_2px_12px_rgba(22,59,72,0.03)] md:p-space-xl">
              <div className="flex flex-col justify-between gap-space-sm pb-space-lg sm:flex-row sm:items-center">
                <div>
                  <span className="font-caption text-caption uppercase tracking-wider text-on-surface-variant">
                    Scheduled Journey
                  </span>
                  <h2 className="mt-space-2xs font-headline-md text-headline-md text-primary">
                    {detail.collectionMode === "HOME_COLLECTION" ? "Servicing Centre" : "Procedure Timeline"}
                  </h2>
                </div>
                <div className="inline-flex items-center gap-space-xs rounded-full bg-primary-fixed px-space-md py-space-2xs font-label-md text-label-md text-primary">
                  <span className="material-symbols-outlined text-[18px]">location_on</span>
                  <span>{detail.centre.name}</span>
                </div>
              </div>

              <div className="relative mt-space-md space-y-space-xl pl-6 before:absolute before:bottom-3 before:left-[11px] before:top-3 before:w-0.5 before:bg-surface-container-high">
                {detail.schedule.map((slot, i) => (
                  <div key={i} className="group relative flex items-start gap-space-md">
                    <div className="absolute -left-[30px] top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary-container font-caption text-caption text-on-primary shadow-sm">
                      {i + 1}
                    </div>
                    <div className="flex-1 rounded-xl bg-surface-container-low p-space-md">
                      <div className="flex flex-wrap items-center justify-between gap-space-xs">
                        <span className="font-label-lg text-label-lg text-primary">
                          {slot.startTime}–{slot.endTime}
                        </span>
                        <span className="rounded-full bg-surface-container-highest px-space-xs py-0.5 font-caption text-caption text-on-surface-variant">
                          {slot.date}
                        </span>
                      </div>
                      <p className="mt-space-2xs font-title-md text-title-md text-on-surface">
                        {slot.type === "LAB"
                          ? "Lab Draw"
                          : slot.type === "HOME_COLLECTION_WINDOW"
                            ? "Home Collection Window"
                            : "Scan"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {detail.lineItems.some((item) => item.preparationInstructions) ? (
                <div className="mt-space-xl flex items-start gap-space-md rounded-xl bg-tertiary-fixed/30 p-space-md">
                  <span className="material-symbols-outlined mt-0.5 shrink-0 text-[24px] text-on-tertiary-fixed-variant">
                    warning
                  </span>
                  <div className="flex flex-col gap-space-2xs">
                    <span className="font-label-lg text-label-lg font-semibold text-on-tertiary-fixed">
                      Essential Pre-Procedure Protocol
                    </span>
                    {detail.lineItems
                      .filter((item) => item.preparationInstructions)
                      .map((item) => (
                        <p key={item.id} className="font-body-md text-body-md text-on-tertiary-fixed-variant">
                          <span className="font-semibold">{item.name}:</span> {item.preparationInstructions}
                        </p>
                      ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="py-8 text-center font-body-md text-body-md text-on-surface-variant">
              Loading booking details…
            </p>
          )}
        </div>

        {/* Right: patient + actions */}
        <div className="flex flex-col gap-space-lg lg:col-span-4">
          {detail ? (
            <div className="flex flex-col gap-space-md rounded-xl bg-surface-container-lowest p-space-lg shadow-[0_2px_12px_rgba(22,59,72,0.03)]">
              <div className="flex items-center justify-between pb-space-sm">
                <span className="font-caption text-caption uppercase tracking-wider text-on-surface-variant">
                  Patient Profile
                </span>
              </div>
              <div className="flex items-center gap-space-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-high font-headline-sm text-headline-sm text-primary">
                  {initials}
                </div>
                <div>
                  <h4 className="font-title-md text-title-md text-primary">{detail.patient.name}</h4>
                  <span className="font-body-md text-body-md text-on-surface-variant">
                    +91 {detail.patient.mobileNumber}
                  </span>
                </div>
              </div>
              <div className="space-y-space-2xs rounded-xl bg-surface-container-low p-space-sm font-caption text-caption text-on-surface-variant">
                <div className="flex justify-between">
                  <span>Primary Phone</span>
                  <span className="font-medium text-on-surface">+91 {detail.patient.mobileNumber}</span>
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-space-sm rounded-xl bg-surface-container-lowest p-space-lg shadow-[0_2px_12px_rgba(22,59,72,0.03)]">
            {pendingSecondCartToken ? (
              <button
                onClick={() => void continueWithSecondCart()}
                className="flex h-touch-target-min w-full items-center justify-center gap-space-xs rounded-xl bg-secondary px-space-lg font-label-lg text-label-lg text-on-secondary shadow-md transition-all hover:bg-on-secondary-container active:scale-[0.99]"
              >
                <span>Continue With Your Lab Tests</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            ) : null}
            <button
              onClick={() => reset()}
              className="flex h-touch-target-min w-full items-center justify-center gap-space-xs rounded-xl bg-surface-container-low px-space-lg font-label-lg text-label-lg text-secondary transition-all hover:bg-surface-container-high active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              <span>Book Another Appointment</span>
            </button>
          </div>

          <div className="rounded-xl bg-surface-container-lowest p-space-lg shadow-[0_2px_12px_rgba(22,59,72,0.03)]">
            <div className="mb-space-sm flex items-center gap-space-xs text-primary">
              <span className="material-symbols-outlined text-[20px]">support_agent</span>
              <h4 className="font-label-lg text-label-lg">24/7 Clinical Concierge</h4>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Need to make clinical adjustments prior to your scan time?
            </p>
            <a
              href="tel:+18004927527"
              className="mt-space-sm inline-flex items-center gap-space-xs font-label-lg text-label-lg text-primary transition-colors hover:text-secondary"
            >
              <span className="material-symbols-outlined text-[18px]">phone</span>
              <span>+1 (800) 492-RLAP</span>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
