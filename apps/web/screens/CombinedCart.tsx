"use client";

import { Breadcrumb } from "../components/AppHeader";
import { usePrimaryAction } from "../components/PrimaryAction";
import { useWidgetStore } from "../lib/store";

/** C1 — Combined Cart: two clearly separated sections, one Continue. */
export function CombinedCart() {
  const cart = useWidgetStore((s) => s.cart);
  const navigate = useWidgetStore((s) => s.navigate);
  const removeItem = useWidgetStore((s) => s.removeItem);
  const loading = useWidgetStore((s) => s.loading);
  const items = cart?.items ?? [];
  const radiologyItems = items.filter((i) => i.itemType === "RADIOLOGY_EXAM");
  const labItems = items.filter((i) => i.itemType === "LAB_TEST");
  const radiologySubtotal = radiologyItems.reduce((sum, i) => sum + i.price, 0);
  const labSubtotal = labItems.reduce((sum, i) => sum + i.price, 0);

  usePrimaryAction({
    label: "Find Centre for Both Services",
    onClick: () => navigate("LOCATION"),
    disabled: items.length === 0,
  });

  return (
    <>
      <Breadcrumb section="Booking" step="Combined Cart" />

      <div className="mb-space-xl flex flex-col gap-space-md md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-space-2xs">
          <h1 className="font-headline-lg text-headline-lg tracking-tight text-primary">
            Review Selected Services
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Verify combined diagnostics before scheduling your sequential same-day clinic visit.
          </p>
        </div>
      </div>

      <div className="mb-space-xl rounded-xl bg-primary-container/10 p-space-md shadow-sm md:p-space-lg">
        <div className="flex items-start gap-space-md">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary shadow-sm">
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </div>
          <div className="flex flex-col gap-space-2xs">
            <div className="flex items-center gap-space-xs">
              <span className="font-label-lg text-label-lg text-primary">
                Combined Visit Coordination Protocol
              </span>
              <span className="rounded-full bg-primary/10 px-space-xs py-0.5 font-caption text-caption text-primary">
                Dual Care Pathway
              </span>
            </div>
            <p className="max-w-4xl font-body-md text-body-md leading-relaxed text-on-surface">
              Your lab sample will be collected at the diagnostic centre during your scan visit —
              home collection is disabled for combined bookings to preserve clinical sequencing,
              optimal fasting integrity, and single-stop convenience.
            </p>
          </div>
        </div>
      </div>

      <div className="grid w-full grid-cols-1 items-start gap-space-xl lg:grid-cols-12">
        {/* Left column: item cards */}
        <div className="flex flex-col gap-space-xl lg:col-span-7 xl:col-span-8">
          <section className="flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container-high text-primary">
                  <span className="material-symbols-outlined text-[18px]">radiology</span>
                </div>
                <h2 className="font-headline-sm text-headline-sm text-primary">
                  Radiology Examinations
                </h2>
              </div>
              <span className="font-caption text-caption text-on-surface-variant">
                {radiologyItems.length} Procedure{radiologyItems.length === 1 ? "" : "s"} Selected
              </span>
            </div>
            {radiologyItems.length === 0 ? (
              <p className="font-body-md text-body-md text-on-surface-variant">
                No radiology items in this cart.
              </p>
            ) : (
              radiologyItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-space-md rounded-xl bg-surface-container-lowest p-space-md shadow-sm transition-shadow duration-200 hover:shadow-md sm:p-space-lg"
                >
                  <div className="flex items-start justify-between gap-space-sm">
                    <div className="flex items-start gap-space-md">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-container-low text-primary">
                        <span className="material-symbols-outlined text-[26px]">vital_signs</span>
                      </div>
                      <div className="flex min-w-0 flex-col gap-space-2xs">
                        <h3 className="font-title-md text-title-md font-semibold text-primary">
                          {item.name}
                        </h3>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-space-xs">
                      <span className="font-headline-sm text-headline-sm font-bold tracking-tight text-primary">
                        ₹{item.price}
                      </span>
                      <button
                        aria-label={`Remove ${item.name}`}
                        disabled={loading}
                        onClick={() => void removeItem(item.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-outline transition-colors hover:bg-error-container/40 hover:text-error"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </section>

          <section className="flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container-high text-primary">
                  <span className="material-symbols-outlined text-[18px]">chips</span>
                </div>
                <h2 className="font-headline-sm text-headline-sm text-primary">
                  Laboratory Diagnostics
                </h2>
                <span className="rounded-full bg-secondary-fixed/50 px-space-xs py-0.5 font-caption text-caption text-on-secondary-fixed-variant">
                  On-Site Phlebotomy
                </span>
              </div>
              <span className="font-caption text-caption text-on-surface-variant">
                {labItems.length} Assay{labItems.length === 1 ? "" : "s"} Selected
              </span>
            </div>
            {labItems.length === 0 ? (
              <p className="font-body-md text-body-md text-on-surface-variant">
                No lab items in this cart.
              </p>
            ) : (
              labItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-space-md rounded-xl bg-surface-container-lowest p-space-md shadow-sm transition-shadow duration-200 hover:shadow-md sm:p-space-lg"
                >
                  <div className="flex items-start justify-between gap-space-sm">
                    <div className="flex items-start gap-space-md">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-container-low text-primary">
                        <span className="material-symbols-outlined text-[26px]">hematology</span>
                      </div>
                      <div className="flex min-w-0 flex-col gap-space-2xs">
                        <h3 className="font-title-md text-title-md font-semibold text-primary">
                          {item.name}
                        </h3>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-space-xs">
                      <span className="font-headline-sm text-headline-sm font-bold tracking-tight text-primary">
                        ₹{item.price}
                      </span>
                      <button
                        aria-label={`Remove ${item.name}`}
                        disabled={loading}
                        onClick={() => void removeItem(item.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-outline transition-colors hover:bg-error-container/40 hover:text-error"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </section>
        </div>

        {/* Right column: summary + CTA */}
        <div className="flex flex-col gap-space-lg lg:sticky lg:top-20 lg:col-span-5 xl:col-span-4">
          <div className="flex flex-col gap-space-lg rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
            <div className="flex items-center justify-between pb-space-xs">
              <h2 className="font-headline-sm text-headline-sm text-primary">Booking Summary</h2>
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-secondary" />
            </div>
            <div className="flex flex-col gap-space-sm font-body-md text-body-md">
              <div className="flex items-center justify-between text-on-surface">
                <span className="text-on-surface-variant">
                  Radiology Subtotal ({radiologyItems.length})
                </span>
                <span className="font-medium text-primary">₹{radiologySubtotal}</span>
              </div>
              <div className="flex items-center justify-between text-on-surface">
                <span className="text-on-surface-variant">
                  Laboratory Subtotal ({labItems.length})
                </span>
                <span className="font-medium text-primary">₹{labSubtotal}</span>
              </div>
              <div className="my-space-2xs h-px w-full bg-surface-container" />
              <div className="flex items-baseline justify-between">
                <span className="font-headline-sm text-headline-sm font-bold text-primary">
                  Total Payable
                </span>
                <span className="font-display-lg text-[32px] font-bold tracking-tight text-primary">
                  ₹{cart?.subtotal ?? 0}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-space-sm rounded-lg bg-surface-container-low p-space-md">
              <div className="flex items-start gap-space-sm">
                <span className="material-symbols-outlined mt-0.5 shrink-0 text-[20px] text-secondary">
                  verified
                </span>
                <div>
                  <p className="font-label-md text-label-md font-semibold text-primary">
                    Same-Visit Convenience Guarantee
                  </p>
                  <p className="font-caption text-caption text-on-surface-variant">
                    One appointment window. Zero dual trips. Single concierge verification at
                    arrival.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-space-sm">
                <span className="material-symbols-outlined mt-0.5 shrink-0 text-[20px] text-primary-container">
                  shield
                </span>
                <div>
                  <p className="font-label-md text-label-md font-semibold text-primary">
                    Zero Pre-payment Mandate
                  </p>
                  <p className="font-caption text-caption text-on-surface-variant">
                    Pay upon arrival at clinic reception via card, insurance claim, or flexible
                    FSA/HSA.
                  </p>
                </div>
              </div>
            </div>

            <p className="pt-space-xs text-center font-caption text-caption text-outline">
              Instant live slot confirmation • Free cancellation up to 2 hours prior
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
