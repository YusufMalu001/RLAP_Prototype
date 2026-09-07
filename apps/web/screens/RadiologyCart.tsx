"use client";

import { CartItemRow } from "../components/CartItemRow";
import { NudgeCard } from "../components/NudgeCard";
import { RecommendedLabTests } from "../components/RecommendedLabTests";
import { Breadcrumb } from "../components/AppHeader";
import { useWidgetStore } from "../lib/store";

/** R4 — Radiology Cart. Also renders OCR-tagged rows inline (§3.5 — no separate O3 screen). */
export function RadiologyCart() {
  const cart = useWidgetStore((s) => s.cart);
  const navigate = useWidgetStore((s) => s.navigate);
  const items = cart?.items ?? [];
  const hasItems = items.length > 0;

  return (
    <>
      <Breadcrumb section="Booking" step="Radiology Cart" />

      <header className="mb-space-lg flex flex-col gap-space-md md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary tracking-tight md:font-headline-lg md:text-headline-lg">
            Your Radiology Cart
          </h1>
          <p className="mt-space-xs font-body-md text-body-md text-on-surface-variant">
            Review your selected exams before finding a centre and time slot.
          </p>
        </div>
        <div className="flex items-center gap-space-sm self-start rounded-full bg-surface-container-low px-space-md py-space-xs shadow-sm">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary font-caption text-[11px] font-bold text-on-primary">
            1
          </span>
          <span className="font-label-md text-label-md text-primary">Cart Review</span>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-space-xl lg:grid-cols-12">
        <div className="flex flex-col gap-space-md lg:col-span-8">
          {!hasItems ? (
            <div className="flex flex-col items-center gap-space-sm rounded-xl bg-surface-container-lowest p-space-2xl text-center shadow-sm">
              <span className="material-symbols-outlined text-[40px] text-outline">
                shopping_bag
              </span>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Your cart is empty.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-space-sm rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
              {items.map((item) => (
                <CartItemRow key={item.id} item={item} />
              ))}
            </div>
          )}

          <button
            onClick={() => navigate("RADIOLOGY_MODALITY")}
            className="flex items-center justify-center gap-space-xs rounded-xl border-2 border-dashed border-outline-variant px-space-md py-space-md font-label-lg text-label-lg font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add another exam
          </button>

          <NudgeCard />

          {hasItems ? <RecommendedLabTests /> : null}
        </div>

        <div className="flex flex-col gap-space-lg lg:sticky lg:top-20 lg:col-span-4">
          <div className="flex flex-col gap-space-lg rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
            <div className="flex items-center justify-between pb-space-xs">
              <h2 className="font-headline-sm text-headline-sm text-primary">Booking Summary</h2>
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-secondary" />
            </div>
            <div className="flex items-baseline justify-between">
              <div>
                <span className="font-headline-sm text-headline-sm font-bold text-primary">
                  Total Payable
                </span>
                <p className="font-caption text-caption text-on-surface-variant">
                  {items.length} item{items.length === 1 ? "" : "s"} in cart
                </p>
              </div>
              <span className="font-display-lg text-[32px] font-bold tracking-tight text-primary">
                ₹{cart?.subtotal ?? 0}
              </span>
            </div>
            <button
              disabled={!hasItems}
              onClick={() => navigate("LOCATION")}
              className="flex h-[54px] w-full items-center justify-center gap-space-sm rounded-lg bg-secondary px-space-lg font-label-lg text-label-lg text-on-secondary shadow-[0_4px_14px_rgba(224,122,95,0.25)] transition-all hover:bg-secondary/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span>Find Centre & Time</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
