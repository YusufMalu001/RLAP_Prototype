"use client";

import { Breadcrumb } from "../components/AppHeader";
import { useWidgetStore } from "../lib/store";

const TILES = [
  {
    key: "RADIOLOGY_MODALITY" as const,
    label: "Radiology",
    hint: "Scans & imaging — Ultrasound, X-Ray, CT, MRI, ECG",
    icon: "radiology",
    accent: "bg-primary-container text-on-primary",
  },
  {
    key: "LAB_CATEGORIES" as const,
    label: "Laboratory",
    hint: "Blood work & sample-based diagnostic tests",
    icon: "biotech",
    accent: "bg-secondary text-on-secondary",
  },
  {
    key: "UPLOAD_PRESCRIPTION" as const,
    label: "Upload Prescription",
    hint: "Let our clinical team read it and route you instantly",
    icon: "document_scanner",
    accent: "bg-surface-container-high text-primary",
  },
];

/** G0 — Entry / Home. */
export function Home() {
  const navigate = useWidgetStore((s) => s.navigate);
  const reset = useWidgetStore((s) => s.reset);
  void reset;

  return (
    <>
      <Breadcrumb section="Booking" step="Select Diagnostics" sessionLabel="New Session" />

      <section className="relative mb-space-2xl overflow-hidden rounded-xl bg-primary-container px-space-lg py-space-2xl text-on-primary shadow-rlap-2 md:px-space-2xl">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-14 left-1/3 h-40 w-40 rounded-full bg-secondary/20" />
        <div className="relative max-w-2xl">
          <div className="mb-space-sm inline-flex items-center gap-space-xs rounded-full bg-white/10 px-space-sm py-1">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            <span className="font-caption text-caption font-semibold uppercase tracking-wide">
              Private Reception · Concierge Booking
            </span>
          </div>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg">
            What would you like to book today?
          </h1>
          <p className="mt-space-sm font-body-lg text-body-lg text-on-primary-container">
            Select a service type below — we&apos;ll guide you through exams, scheduling, and
            preparation instructions in a few simple steps.
          </p>
        </div>
      </section>

      <h2 className="mb-space-md font-label-lg text-label-lg uppercase tracking-wide text-on-surface-variant">
        Select Service Type
      </h2>

      <div className="grid grid-cols-1 gap-space-md md:grid-cols-3">
        {TILES.map((tile) => (
          <button
            key={tile.key}
            onClick={() => navigate(tile.key)}
            className="group flex flex-col items-start gap-space-md rounded-xl bg-surface-container-lowest p-space-lg text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-xl shadow-sm ${tile.accent}`}
            >
              <span className="material-symbols-outlined text-[28px]">{tile.icon}</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-primary transition-colors group-hover:text-secondary">
                {tile.label}
              </h3>
              <p className="mt-space-2xs font-body-md text-body-md text-on-surface-variant">
                {tile.hint}
              </p>
            </div>
            <span className="mt-space-xs inline-flex items-center gap-space-xs font-label-md text-label-md font-semibold text-primary">
              Get started
              <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-1">
                arrow_forward
              </span>
            </span>
          </button>
        ))}
      </div>

      <div className="mt-space-2xl flex flex-col gap-space-md rounded-xl bg-surface-container-low p-space-lg shadow-sm md:flex-row md:items-center">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-container-lowest text-secondary shadow-sm">
          <span className="material-symbols-outlined text-[24px]">shield</span>
        </div>
        <div>
          <div className="font-label-lg text-label-lg font-semibold text-primary">
            Your Safety First
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">
            All diagnostic services are HIPAA-compliant and administered by certified medical
            professionals across our accredited centres.
          </p>
        </div>
      </div>
    </>
  );
}
