"use client";

import { useEffect, useState } from "react";
import { Breadcrumb } from "../components/AppHeader";
import { api } from "../lib/apiClient";
import { cartScreenFor, useWidgetStore } from "../lib/store";
import type { LabTestDetail } from "../lib/types";

/** L2 — Test / Package Detail. */
export function LabItemDetail() {
  const orgSlug = useWidgetStore((s) => s.orgSlug);
  const testId = useWidgetStore((s) => s.selectedLabTestId);
  const addItem = useWidgetStore((s) => s.addItem);
  const navigate = useWidgetStore((s) => s.navigate);
  const loading = useWidgetStore((s) => s.loading);
  const [test, setTest] = useState<LabTestDetail | null>(null);

  useEffect(() => {
    if (!orgSlug || !testId) return;
    api.labTestDetail(orgSlug, testId).then((res) => setTest(res.test));
  }, [orgSlug, testId]);

  if (!test) {
    return (
      <>
        <Breadcrumb section="Laboratory" step="Loading…" />
        <p className="py-8 text-center font-body-md text-body-md text-on-surface-variant">
          Loading test details…
        </p>
      </>
    );
  }

  const handleAdd = async () => {
    await addItem("LAB_TEST", test.id);
    navigate(cartScreenFor(useWidgetStore.getState().cart?.cartType ?? null));
  };

  return (
    <>
      <Breadcrumb section="Laboratory" step={test.name} />

      <div className="grid grid-cols-1 items-start gap-gutter-desktop pb-32 lg:grid-cols-12">
        {/* Left / Primary Column */}
        <div className="flex flex-col gap-space-lg lg:col-span-8">
          {/* Hero summary card */}
          <section className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-card-pad-lg shadow-sm">
            <div className="pointer-events-none absolute -top-12 -right-12 h-48 w-48 rounded-full bg-primary-fixed/20 blur-2xl" />
            <div className="relative z-10 flex flex-col gap-space-md">
              <div className="flex flex-wrap items-center justify-between gap-space-sm">
                <span className="rounded-full bg-primary/5 px-space-sm py-1 font-label-md text-label-md tracking-wide text-primary">
                  {test.isPackage ? "Package" : "Individual Test"}
                </span>
                <span className="rounded-full bg-surface-container-high px-space-sm py-0.5 font-caption text-caption text-primary">
                  {test.category}
                </span>
              </div>
              <div className="space-y-1">
                <h1 className="font-headline-lg text-headline-lg tracking-tight text-primary">
                  {test.name}
                </h1>
                {test.includedParameters.length > 0 ? (
                  <p className="max-w-2xl font-body-md text-body-md text-on-surface-variant">
                    Covers {test.includedParameters.length} clinical parameters in a single verified sample.
                  </p>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-space-sm pt-space-xs sm:grid-cols-4">
                <div className="flex flex-col justify-between rounded-lg bg-surface-container-low p-space-sm">
                  <div className="flex items-center gap-1 font-caption text-caption text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px] text-primary">biotech</span>
                    <span>Parameters</span>
                  </div>
                  <span className="mt-1 font-label-lg text-label-lg text-primary">
                    {test.includedParameters.length || 1}
                  </span>
                </div>
                <div className="flex flex-col justify-between rounded-lg bg-surface-container-low p-space-sm">
                  <div className="flex items-center gap-1 font-caption text-caption text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px] text-secondary">restaurant</span>
                    <span>Preparation</span>
                  </div>
                  <span className="mt-1 font-label-lg text-label-lg text-primary">
                    {test.preparationInstructions ? "Required" : "None"}
                  </span>
                </div>
                <div className="flex flex-col justify-between rounded-lg bg-surface-container-low p-space-sm">
                  <div className="flex items-center gap-1 font-caption text-caption text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px] text-primary">home_health</span>
                    <span>Collection</span>
                  </div>
                  <span className="mt-1 font-label-lg text-label-lg text-primary">
                    {test.homeCollectionEligible ? "Home & Centre" : "Centre Only"}
                  </span>
                </div>
                <div className="flex flex-col justify-between rounded-lg bg-surface-container-low p-space-sm">
                  <div className="flex items-center gap-1 font-caption text-caption text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px] text-primary">verified</span>
                    <span>Category</span>
                  </div>
                  <span className="mt-1 font-label-lg text-label-lg text-primary">{test.category}</span>
                </div>
              </div>

              <div className="-mx-card-pad-lg -mb-card-pad-lg mt-space-xs flex flex-col gap-space-md bg-primary/5 px-card-pad-lg py-space-md pt-space-xs sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-baseline gap-space-xs">
                  <span className="font-display-lg text-display-lg font-bold text-primary">
                    ₹{test.price}
                  </span>
                  <span className="ml-1 font-caption text-caption text-on-surface-variant">
                    Self-Pay Transparent Guarantee
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Preparation instructions callout */}
          {test.preparationInstructions ? (
            <section className="flex flex-col gap-space-sm rounded-xl bg-secondary-fixed/30 p-card-md shadow-sm">
              <div className="flex items-center gap-space-xs">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/15 text-secondary">
                  <span className="material-symbols-outlined text-[20px]">info</span>
                </div>
                <div>
                  <h2 className="font-title-md text-title-md leading-tight text-primary">
                    Patient Preparation Protocol
                  </h2>
                  <p className="font-caption text-caption text-on-surface-variant">
                    Guidelines to ensure clinical validity
                  </p>
                </div>
              </div>
              <p className="rounded-lg bg-surface-container-lowest/80 p-space-sm font-body-md text-body-md text-on-surface-variant">
                {test.preparationInstructions}
              </p>
            </section>
          ) : null}

          {/* Included parameters */}
          {test.includedParameters.length > 0 ? (
            <section className="flex flex-col gap-space-md rounded-xl bg-surface-container-lowest p-card-pad-lg shadow-sm">
              <div>
                <span className="font-caption text-caption font-bold uppercase tracking-wider text-secondary">
                  Clinical Scope
                </span>
                <h2 className="font-headline-md text-headline-md text-primary">
                  {test.includedParameters.length} Analyzed Parameters
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-space-xs sm:grid-cols-2 md:grid-cols-3">
                {test.includedParameters.map((param) => (
                  <div key={param} className="rounded-md bg-surface-container-low p-space-xs">
                    <p className="font-label-md text-label-md text-primary">{param}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        {/* Right Concierge Rail */}
        <div className="flex flex-col gap-space-md lg:sticky lg:top-24 lg:col-span-4 lg:self-start">
          <div className="flex flex-col gap-space-md rounded-xl bg-surface-container-lowest p-card-md shadow-sm">
            <div className="flex items-center gap-space-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-container-low text-primary">
                <span className="material-symbols-outlined text-[20px]">
                  {test.homeCollectionEligible ? "home_health" : "local_hospital"}
                </span>
              </div>
              <span className="font-title-md text-title-md font-semibold text-primary">
                Collection Mode
              </span>
            </div>
            <p className="font-body-md text-body-md leading-relaxed text-on-surface-variant">
              {test.homeCollectionEligible
                ? "Eligible for home sample collection or a centre visit."
                : "Centre visit required for this test."}
            </p>
            <div className="grid grid-cols-2 gap-space-sm">
              <div className="flex flex-col justify-between rounded-lg bg-surface-container-low p-space-sm">
                <span className="font-caption text-caption text-on-surface-variant">Price</span>
                <span className="mt-1 font-label-lg text-label-lg font-bold text-primary">
                  ₹{test.price}
                </span>
              </div>
              <div className="flex flex-col justify-between rounded-lg bg-surface-container-low p-space-sm">
                <span className="font-caption text-caption text-on-surface-variant">Category</span>
                <span className="mt-1 truncate font-label-lg text-label-lg font-semibold text-primary">
                  {test.category}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom-anchored action deck */}
      <div className="fixed inset-x-0 bottom-0 z-40 bg-surface/95 px-margin-mobile py-space-sm shadow-[0_-4px_24px_rgba(22,59,72,0.08)] backdrop-blur-xl lg:px-margin-desktop">
        <div className="mx-auto flex max-w-[1180px] flex-col items-center justify-between gap-space-sm sm:flex-row">
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm font-bold text-primary">₹{test.price}</span>
            <span className="font-caption text-caption text-on-surface-variant">{test.name}</span>
          </div>
          <button
            disabled={loading}
            onClick={() => void handleAdd()}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-secondary px-space-lg font-label-lg text-label-lg text-on-secondary shadow-md transition-all hover:bg-secondary/90 disabled:opacity-60 sm:w-auto"
          >
            <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
            <span>{loading ? "Adding…" : `Add to Cart — ₹${test.price}`}</span>
          </button>
        </div>
      </div>
    </>
  );
}
