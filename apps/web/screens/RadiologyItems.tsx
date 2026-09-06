"use client";

import { useEffect, useState } from "react";
import { Breadcrumb } from "../components/AppHeader";
import { api } from "../lib/apiClient";
import { cartScreenFor, useWidgetStore } from "../lib/store";
import type { RadiologyExamSummary } from "../lib/types";

/** R3 — Body Part — Item Selection. */
export function RadiologyItems() {
  const orgSlug = useWidgetStore((s) => s.orgSlug);
  const modality = useWidgetStore((s) => s.selectedModality);
  const category = useWidgetStore((s) => s.selectedCategory);
  const addItem = useWidgetStore((s) => s.addItem);
  const removeItem = useWidgetStore((s) => s.removeItem);
  const navigate = useWidgetStore((s) => s.navigate);
  const cart = useWidgetStore((s) => s.cart);
  const loading = useWidgetStore((s) => s.loading);
  const [exams, setExams] = useState<RadiologyExamSummary[]>([]);

  useEffect(() => {
    if (!orgSlug) return;
    api
      .radiologyExams(orgSlug, { modality: modality ?? undefined, category: category ?? undefined })
      .then((res) => setExams(res.exams));
  }, [orgSlug, modality, category]);

  const addedIds = new Set(cart?.items.map((item) => item.radiologyExamId).filter(Boolean));
  const hasItems = (cart?.items.length ?? 0) > 0;
  const itemCount = cart?.items.length ?? 0;
  const total = cart?.subtotal ?? 0;

  return (
    <>
      <Breadcrumb section="Radiology" step="Select Exam" />

      <header className="mb-space-lg max-w-3xl">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary tracking-tight md:font-headline-lg md:text-headline-lg">
          Select your exam
        </h1>
        <p className="mt-space-xs font-body-lg text-body-lg text-on-surface-variant">
          Choose one or more prescribed imaging procedures. You can add as many as needed before
          continuing.
        </p>
      </header>

      <section className="mb-space-2xl flex flex-col gap-space-md pb-space-2xl">
        {exams.map((exam) => {
          const added = addedIds.has(exam.id);
          const cartItemId = cart?.items.find((item) => item.radiologyExamId === exam.id)?.id;
          return (
            <div
              key={exam.id}
              className={`relative flex flex-col gap-space-md overflow-hidden rounded-xl bg-surface-container-lowest p-space-lg shadow-sm transition-all duration-200 hover:shadow-md sm:flex-row sm:items-center sm:justify-between ${
                added ? "shadow-md" : ""
              }`}
            >
              {added ? <div className="absolute bottom-0 left-0 top-0 w-1.5 bg-secondary" /> : null}
              <div className="flex min-w-0 items-start gap-space-md pl-1">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                    added ? "bg-primary-fixed text-primary" : "bg-surface-container text-primary"
                  }`}
                >
                  <span className="material-symbols-outlined text-[26px]">vital_signs</span>
                </div>
                <div className="min-w-0">
                  <h2 className="truncate font-title-md text-title-md font-semibold text-primary">
                    {exam.name}
                  </h2>
                  {exam.requiresSafetyCheck ? (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-secondary-fixed px-space-xs py-0.5 font-caption text-caption font-semibold text-on-secondary-container">
                      <span className="material-symbols-outlined text-[13px]">shield</span>
                      Safety screening required
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 items-center justify-between gap-space-lg pt-space-xs sm:justify-end sm:pt-0">
                <div className="text-left sm:text-right">
                  <div className="font-caption text-caption font-medium text-outline">
                    Standard Patient Fee
                  </div>
                  <div className="font-headline-sm text-headline-sm font-bold text-primary">
                    ₹{exam.price}
                  </div>
                </div>
                <button
                  onClick={() =>
                    added && cartItemId
                      ? void removeItem(cartItemId)
                      : void addItem("RADIOLOGY_EXAM", exam.id)
                  }
                  aria-label={added ? `Remove ${exam.name}` : `Add ${exam.name}`}
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-sm transition-all ${
                    added
                      ? "bg-secondary text-on-secondary"
                      : "bg-primary-container text-on-primary hover:bg-primary"
                  }`}
                >
                  <span className="material-symbols-outlined text-[24px]">
                    {added ? "check" : "add"}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
        {exams.length === 0 ? (
          <p className="py-space-xl text-center font-body-md text-body-md text-on-surface-variant">
            No exams found here.
          </p>
        ) : null}
      </section>

      <div className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-margin-mobile pointer-events-none">
        <div className="pointer-events-auto flex w-full max-w-2xl items-center justify-between gap-space-md rounded-2xl bg-surface-container-lowest/95 p-space-sm shadow-xl backdrop-blur-md sm:p-3">
          <div className="flex items-center gap-space-md pl-space-xs">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary">
              <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
              {itemCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-secondary font-caption text-[11px] font-bold text-on-secondary">
                  {itemCount}
                </span>
              ) : null}
            </div>
            <div className="flex flex-col">
              <span className="font-label-lg text-label-lg font-bold text-primary">
                {hasItems
                  ? `${itemCount} exam${itemCount === 1 ? "" : "s"} selected (₹${total})`
                  : "No exams selected yet"}
              </span>
              <span className="font-caption text-caption text-on-surface-variant">
                Single slot booking optimized
              </span>
            </div>
          </div>
          <button
            disabled={!hasItems || loading}
            onClick={() => navigate(cartScreenFor(cart?.cartType ?? null))}
            className="flex h-12 shrink-0 items-center gap-space-xs whitespace-nowrap rounded-xl bg-secondary px-space-lg font-label-lg text-label-lg font-bold text-on-secondary shadow-md transition-all hover:opacity-95 disabled:opacity-40"
          >
            <span>{loading ? "Adding…" : "View Cart"}</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </>
  );
}
