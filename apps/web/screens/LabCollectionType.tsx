"use client";

import { Breadcrumb } from "../components/AppHeader";
import { useWidgetStore } from "../lib/store";

/** L4 — Sample Collection Type. */
export function LabCollectionType() {
  const navigate = useWidgetStore((s) => s.navigate);

  return (
    <>
      <Breadcrumb section="Laboratory" step="Select Collection Mode" />

      <div className="mb-space-xl max-w-3xl">
        <h1 className="mb-space-xs font-display-lg text-display-lg tracking-tight text-primary">
          How would you prefer to provide your samples?
        </h1>
        <p className="font-body-lg text-body-lg leading-relaxed text-on-surface-variant">
          Choose between private doorstep phlebotomy by certified medical technicians or an appointment
          at an RLAP diagnostic lounge.
        </p>
      </div>

      <div className="mb-space-xl grid grid-cols-1 gap-space-lg lg:grid-cols-2 lg:gap-space-xl">
        {/* Home Sample Collection */}
        <button
          onClick={() => navigate("LAB_HOME_ADDRESS")}
          className="group relative flex flex-col justify-between rounded-xl bg-surface-container-lowest p-card-pad-lg text-left shadow-sm transition-all duration-200 hover:shadow-md"
        >
          <div className="mb-space-lg flex items-start justify-between gap-space-md">
            <div className="flex items-center gap-space-md">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary-fixed text-secondary shadow-sm transition-transform duration-200 group-hover:scale-105">
                <span className="material-symbols-outlined text-[30px]">home_health</span>
              </div>
              <div>
                <span className="font-headline-sm text-headline-sm text-primary">
                  Home Sample Collection
                </span>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  We&apos;ll send a certified technician to you
                </p>
              </div>
            </div>
          </div>

          <div className="mb-space-md">
            <span className="inline-flex items-center gap-space-2xs rounded-full bg-primary-fixed px-space-sm py-1 font-caption text-caption text-on-primary-fixed">
              <span className="material-symbols-outlined text-[15px]">verified</span>
              Zero Travel • Comfortable At-Home Draw
            </span>
          </div>

          <div className="mb-space-xl flex-grow space-y-space-sm">
            <div className="flex items-start gap-space-sm">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-container-low text-primary-container">
                <span className="material-symbols-outlined text-[18px]">ac_unit</span>
              </div>
              <div className="min-w-0">
                <p className="font-label-lg text-label-lg text-on-surface">
                  Temperature-controlled portable cold-chain kit
                </p>
                <p className="font-caption text-caption text-on-surface-variant">
                  Continuous sub-4°C automated refrigeration during transit
                </p>
              </div>
            </div>
            <div className="flex items-start gap-space-sm">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-container-low text-secondary">
                <span className="material-symbols-outlined text-[18px]">payments</span>
              </div>
              <div className="min-w-0">
                <p className="font-label-lg text-label-lg text-on-surface">Convenience fee: Nominal charge</p>
                <p className="font-caption text-caption font-medium text-secondary">
                  A collection charge applies at checkout
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t-0 pt-space-md">
            <div className="flex items-center gap-space-2xs font-label-lg text-label-lg text-secondary transition-transform group-hover:translate-x-1">
              <span>Select Home Collection</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </div>
          </div>
        </button>

        {/* Visit the Centre */}
        <button
          onClick={() => navigate("LOCATION")}
          className="group relative flex flex-col justify-between rounded-xl bg-surface-container-lowest p-card-pad-lg text-left shadow-sm transition-all duration-200 hover:shadow-md"
        >
          <div className="mb-space-lg flex items-start justify-between gap-space-md">
            <div className="flex items-center gap-space-md">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-surface-container-high text-primary shadow-sm transition-transform duration-200 group-hover:scale-105">
                <span className="material-symbols-outlined text-[30px]">apartment</span>
              </div>
              <div>
                <span className="font-headline-sm text-headline-sm text-primary">Visit the Centre</span>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Book a slot at a nearby centre
                </p>
              </div>
            </div>
          </div>

          <div className="mb-space-md">
            <span className="inline-flex items-center gap-space-2xs rounded-full bg-surface-container px-space-sm py-1 font-caption text-caption text-on-surface-variant">
              <span className="material-symbols-outlined text-[15px]">speed</span>
              Fastest Turnaround • Walk-in or Reserved Slot
            </span>
          </div>

          <div className="mb-space-xl flex-grow space-y-space-sm">
            <div className="flex items-start gap-space-sm">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-container-low text-primary-container">
                <span className="material-symbols-outlined text-[18px]">volume_off</span>
              </div>
              <div className="min-w-0">
                <p className="font-label-lg text-label-lg text-on-surface">Private acoustic phlebotomy lounges</p>
                <p className="font-caption text-caption text-on-surface-variant">
                  Individual sanitized suites • zero communal waiting room crowding
                </p>
              </div>
            </div>
            <div className="flex items-start gap-space-sm">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-container-low text-primary-container">
                <span className="material-symbols-outlined text-[18px]">science</span>
              </div>
              <div className="min-w-0">
                <p className="font-label-lg text-label-lg text-on-surface">
                  Immediate barcode accession &amp; processing
                </p>
                <p className="font-caption text-caption text-on-surface-variant">
                  Instant on-site analysis initiation minimizes pre-analytical error
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t-0 pt-space-md">
            <div className="flex items-center gap-space-2xs font-label-lg text-label-lg text-primary transition-transform group-hover:translate-x-1">
              <span>Select Centre Visit</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </div>
          </div>
        </button>
      </div>

      {/* Chain-of-custody reassurance strip */}
      <div className="mb-space-lg flex flex-col items-start gap-space-md rounded-xl bg-surface-container-low p-space-md shadow-sm md:flex-row md:items-center lg:p-space-lg">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary">
          <span className="material-symbols-outlined text-[20px]">shield_with_heart</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-0.5 font-label-lg text-label-lg text-primary">Clinical Rigor Guarantee</p>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Both options guarantee ISO 15189 certified phlebotomy standards, strict sample
            chain-of-custody, and digital reports delivered directly to your RLAP portal.
          </p>
        </div>
      </div>
    </>
  );
}
