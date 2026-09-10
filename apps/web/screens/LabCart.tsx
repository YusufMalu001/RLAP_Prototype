"use client";

import { Breadcrumb } from "../components/AppHeader";
import { CartItemRow } from "../components/CartItemRow";
import { NudgeCard } from "../components/NudgeCard";
import { usePrimaryAction } from "../components/PrimaryAction";
import { useWidgetStore } from "../lib/store";

/** L3 — Laboratory Cart. */
export function LabCart() {
  const cart = useWidgetStore((s) => s.cart);
  const navigate = useWidgetStore((s) => s.navigate);
  const items = cart?.items ?? [];
  const subtotal = cart?.subtotal ?? 0;

  usePrimaryAction(
    items.length === 0
      ? null
      : {
          label: "Continue to Sample Collection",
          onClick: () => navigate("LAB_COLLECTION_TYPE"),
        }
  );

  return (
    <>
      <Breadcrumb section="Laboratory" step="Review Selected Tests" />

      <div className="mb-space-lg flex flex-col gap-space-xs">
        <h1 className="font-headline-lg text-headline-lg tracking-tight text-primary">
          Your Selected Examinations
        </h1>
        <p className="max-w-3xl font-body-md text-body-md text-on-surface-variant">
          Review your scheduled laboratory tests and profiles. Fasting windows and processing timelines
          are compiled automatically.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-space-sm rounded-xl bg-surface-container-lowest py-16 text-center shadow-sm">
          <span className="material-symbols-outlined text-[40px] text-outline">science</span>
          <p className="font-body-md text-body-md text-on-surface-variant">Your cart is empty.</p>
          <button
            onClick={() => navigate("LAB_CATEGORIES")}
            className="mt-space-xs rounded-lg bg-primary px-space-md py-space-xs font-label-lg text-label-lg text-on-primary shadow-rlap-1 transition-colors hover:bg-secondary"
          >
            Browse Tests
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-gutter-desktop pb-32 lg:grid-cols-12">
          {/* Left: line items */}
          <div className="flex flex-col gap-space-lg lg:col-span-7">
            <div className="flex flex-col gap-space-md">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="relative rounded-xl bg-surface-container-lowest p-card-pad-lg shadow-[0_2px_8px_rgba(22,59,72,0.04),0_12px_28px_rgba(22,59,72,0.05)]"
                >
                  <CartItemRow item={item} />
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate("LAB_CATEGORIES")}
              className="w-full rounded-lg border-2 border-dashed border-outline-variant px-space-md py-space-sm font-body-md text-body-md font-medium text-on-surface-variant transition-colors hover:bg-surface-container"
            >
              + Add another test
            </button>

            <NudgeCard />
          </div>

          {/* Right: fee breakdown */}
          <div className="flex flex-col gap-space-md lg:col-span-5">
            <div className="rounded-xl bg-surface-container-lowest p-card-pad-lg shadow-[0_4px_16px_rgba(22,59,72,0.05),0_16px_36px_rgba(22,59,72,0.06)]">
              <div className="flex items-center justify-between pb-space-sm">
                <span className="font-title-md text-title-md font-bold text-primary">Fee Breakdown</span>
                <span className="rounded bg-primary-fixed/40 px-space-xs py-0.5 font-caption text-caption font-semibold text-primary-container">
                  {items.length} Selected
                </span>
              </div>
              <div className="flex flex-col gap-space-sm py-space-md">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-on-surface">
                    <span className="truncate pr-space-sm font-body-md text-body-md">{item.name}</span>
                    <span className="shrink-0 font-label-lg text-label-lg font-semibold">₹{item.price}</span>
                  </div>
                ))}
              </div>
              <div className="-mx-card-pad-lg -mb-card-pad-lg mt-space-xs rounded-b-xl bg-surface-container-low/50 px-card-pad-lg pb-card-pad-lg pt-space-md">
                <div className="flex items-baseline justify-between">
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md text-on-surface-variant">
                      Estimated Total Due
                    </span>
                    <span className="font-caption text-caption text-outline">
                      Inclusive of all collection and lab fees
                    </span>
                  </div>
                  <span className="font-display-lg text-display-lg font-bold tracking-tight text-primary">
                    ₹{subtotal}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
