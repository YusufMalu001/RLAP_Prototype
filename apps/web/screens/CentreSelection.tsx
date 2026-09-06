"use client";

import { Breadcrumb } from "../components/AppHeader";
import { useWidgetStore } from "../lib/store";

/** R6 / L5b / C2 — Centre Selection, one component parameterized by cartType. */
export function CentreSelection() {
  const centres = useWidgetStore((s) => s.centres);
  const centresLoading = useWidgetStore((s) => s.centresLoading);
  const cartType = useWidgetStore((s) => s.cart?.cartType);
  const location = useWidgetStore((s) => s.location);
  const selectedArea = location && "area" in location ? location.area : null;
  const selectCentre = useWidgetStore((s) => s.selectCentre);
  const splitIntoTwoBookings = useWidgetStore((s) => s.splitIntoTwoBookings);
  const loading = useWidgetStore((s) => s.loading);
  const navigate = useWidgetStore((s) => s.navigate);

  if (centresLoading) {
    return (
      <>
        <Breadcrumb section="Booking" step="Centre Availability" sessionLabel="Step 2 of 4" />
        <div className="flex flex-col items-center justify-center gap-space-md py-space-2xl text-center">
          <span className="material-symbols-outlined animate-pulse text-[40px] text-primary-container">
            corporate_fare
          </span>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Looking for centres near you…
          </p>
        </div>
      </>
    );
  }

  if (centres.length === 0) {
    const isCombined = cartType === "COMBINED";
    return (
      <>
        <Breadcrumb section="Booking" step="Centre Availability" sessionLabel="Step 2 of 4" />
        <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-space-lg shadow-[0_4px_24px_rgba(22,59,72,0.05)] lg:p-space-2xl">
          <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-secondary-fixed/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-primary-fixed/40 blur-3xl" />
          <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center text-center">
            <span className="mb-space-2xs font-caption text-caption font-semibold uppercase tracking-widest text-secondary">
              Multi-Disciplinary Combination
            </span>
            <h1 className="mb-space-sm font-headline-lg text-headline-lg leading-tight text-primary">
              {isCombined
                ? "No single facility offers every selected diagnostic on your date"
                : "No centre nearby offers everything in your cart"}
            </h1>
            <p className="mb-space-xl text-center font-body-md text-body-md leading-relaxed text-on-surface-variant">
              {isCombined
                ? "You can split this into two separate bookings, or contact us for help."
                : "Try broadening your search, or contact us for help."}
            </p>

            {isCombined ? (
              <div className="mb-space-xl grid w-full grid-cols-1 gap-space-md sm:grid-cols-2">
                <button
                  disabled={loading}
                  onClick={() => void splitIntoTwoBookings()}
                  className="group flex flex-col items-start rounded-lg bg-secondary p-space-md text-left text-on-secondary shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:opacity-60"
                  type="button"
                >
                  <div className="mb-space-xs flex w-full items-center justify-between">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-on-secondary/15">
                      <span className="material-symbols-outlined text-[18px]">splitscreen</span>
                    </span>
                    <span className="font-caption text-caption font-semibold uppercase tracking-wider text-secondary-fixed">
                      Self-Guided
                    </span>
                  </div>
                  <span className="mb-space-2xs font-title-md text-title-md font-semibold text-on-secondary">
                    {loading ? "Splitting…" : "Split Into Two Sessions"}
                  </span>
                  <p className="font-caption text-caption leading-snug text-on-secondary/85">
                    Reserve each service separately at the nearest centre that offers it.
                  </p>
                </button>
                <button
                  onClick={() => navigate("HOME")}
                  className="group flex flex-col items-start rounded-lg bg-primary-container p-space-md text-left text-on-primary shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
                  type="button"
                >
                  <div className="mb-space-xs flex w-full items-center justify-between">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-on-primary/15">
                      <span className="material-symbols-outlined text-[18px]">support_agent</span>
                    </span>
                    <span className="font-caption text-caption font-semibold uppercase tracking-wider text-primary-fixed">
                      Direct Assistance
                    </span>
                  </div>
                  <span className="mb-space-2xs font-title-md text-title-md font-semibold text-on-primary">
                    Speak with Concierge
                  </span>
                  <p className="font-caption text-caption leading-snug text-on-primary/85">
                    Our medical reception desk can manually coordinate a priority transfer.
                  </p>
                </button>
              </div>
            ) : (
              <div className="mb-space-xl w-full space-y-space-sm">
                <button
                  onClick={() => navigate("LOCATION")}
                  className="flex min-h-[52px] w-full items-center justify-center gap-space-xs rounded-lg bg-secondary font-label-lg text-label-lg text-on-secondary shadow-md transition-all hover:bg-secondary/90 active:scale-[0.99]"
                  type="button"
                >
                  <span>Broaden Search</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
                <button
                  onClick={() => navigate("HOME")}
                  className="flex min-h-[52px] w-full items-center justify-center rounded-lg border-2 border-outline-variant font-label-lg text-label-lg text-primary transition-colors hover:bg-surface-container"
                  type="button"
                >
                  Contact Support
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-space-xs text-center">
              <span className="material-symbols-outlined text-[16px] text-secondary">
                verified
              </span>
              <span className="font-caption text-caption text-on-surface-variant">
                RLAP Dedicated Reception Desk:{" "}
                <strong className="font-medium text-primary">+1 (800) 492-RLAP</strong> • Direct
                medical coordination with zero call queueing
              </span>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Breadcrumb section="Booking" step="Centre Availability" sessionLabel="Step 2 of 4" />

      <div className="mb-space-lg flex flex-col gap-space-md lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-1">
          <div className="inline-flex items-center gap-1.5 font-label-md text-label-md font-semibold text-secondary">
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span>NABH &amp; CAP Accredited Medical Chambers</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg font-bold tracking-tight text-primary">
            Select Accredited Diagnostic Centre
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            All suites feature private acoustic soundproofing, certified clinical sonologists, and
            zero-hallway waiting protocols.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-space-lg lg:grid-cols-12">
        <div className="flex flex-col gap-space-md lg:col-span-7">
          {centres.map((centre) => (
            <button
              key={centre.id}
              disabled={loading}
              onClick={() => void selectCentre(centre.id)}
              className="group relative flex flex-col gap-space-md rounded-xl bg-surface-container-lowest p-space-md text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 sm:p-space-lg"
              type="button"
            >
              <div className="flex items-start justify-between gap-space-sm">
                <div className="flex items-start gap-space-sm">
                  <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-container-low text-primary">
                    <span className="material-symbols-outlined text-[24px]">corporate_fare</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-title-md text-title-md font-bold text-on-surface transition-colors group-hover:text-primary">
                        {centre.name}
                      </h2>
                      {selectedArea && centre.area.toLowerCase() === selectedArea.toLowerCase() ? (
                        <span className="rounded-full bg-secondary-fixed px-2 py-0.5 font-caption text-caption font-semibold text-on-secondary-fixed">
                          In {centre.area}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 font-body-md text-body-md leading-relaxed text-on-surface-variant">
                      {centre.address}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 font-label-md text-label-md text-on-surface-variant">
                      {typeof centre.distanceKm === "number" ? (
                        <>
                          <span className="material-symbols-outlined text-[18px] text-outline">
                            near_me
                          </span>
                          <span className="font-semibold text-on-surface">
                            {centre.distanceKm.toFixed(1)} km away
                          </span>
                        </>
                      ) : null}
                      {centre.offersRadiology ? (
                        <span className="rounded-md bg-surface-container-low px-2.5 py-1 font-caption text-caption font-medium text-on-surface">
                          Radiology
                        </span>
                      ) : null}
                      {centre.offersLab ? (
                        <span className="rounded-md bg-surface-container-low px-2.5 py-1 font-caption text-caption font-medium text-on-surface">
                          Lab
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-container-high transition-colors group-hover:bg-surface-container-highest">
                  <span className="h-2.5 w-2.5 rounded-full bg-surface-container-lowest" />
                </div>
              </div>
            </button>
          ))}

          <div className="flex items-start gap-space-sm rounded-xl bg-surface-container-low p-space-md">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary-fixed text-on-secondary-fixed">
              <span className="material-symbols-outlined text-[20px]">shield_with_heart</span>
            </div>
            <div className="flex flex-col text-left">
              <span className="font-label-md text-label-md font-semibold text-primary">
                RLAP Sanctuary Care Standard
              </span>
              <p className="mt-0.5 font-caption text-caption text-on-surface-variant">
                Every patient receives an individual, private acoustic pod before examination.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-space-md lg:sticky lg:top-24 lg:col-span-5">
          <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
            <div className="flex items-center gap-space-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-primary">
                <span className="material-symbols-outlined text-[20px]">directions_car</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-md text-label-md font-semibold text-primary">
                  Select a centre to continue
                </span>
                <span className="font-caption text-caption text-on-surface-variant">
                  We&apos;ll check safety requirements next
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
