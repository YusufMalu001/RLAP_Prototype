"use client";

import { useEffect, useState } from "react";
import { Breadcrumb } from "../components/AppHeader";
import { usePrimaryAction } from "../components/PrimaryAction";
import { api } from "../lib/apiClient";
import { cartScreenFor, useWidgetStore } from "../lib/store";
import type { LabTestSummary } from "../lib/types";

/** L1 — Laboratory Browse (Categories): categories, curated packages, and individual tests together. */
export function LabCategories() {
  const orgSlug = useWidgetStore((s) => s.orgSlug);
  const selectedCategory = useWidgetStore((s) => s.selectedLabCategory);
  const setLabCategory = useWidgetStore((s) => s.setLabCategory);
  const setSelectedLabTest = useWidgetStore((s) => s.setSelectedLabTest);
  const addItem = useWidgetStore((s) => s.addItem);
  const removeItem = useWidgetStore((s) => s.removeItem);
  const navigate = useWidgetStore((s) => s.navigate);
  const cart = useWidgetStore((s) => s.cart);

  const [categories, setCategories] = useState<string[]>([]);
  const [packages, setPackages] = useState<LabTestSummary[]>([]);
  const [tests, setTests] = useState<LabTestSummary[]>([]);

  useEffect(() => {
    if (!orgSlug) return;
    api.labCategories(orgSlug).then((res) => {
      setCategories(res.categories);
      setPackages(res.packages);
    });
  }, [orgSlug]);

  useEffect(() => {
    if (!orgSlug) return;
    api.labTests(orgSlug, selectedCategory ?? undefined).then((res) => setTests(res.tests));
  }, [orgSlug, selectedCategory]);

  const addedIds = new Set(cart?.items.map((item) => item.labTestId).filter(Boolean));
  const filteredTests = tests.filter((test) => !test.isPackage);
  const cartCount = cart?.items.length ?? 0;
  const cartSubtotal = cart?.subtotal ?? 0;

  usePrimaryAction(
    cartCount > 0
      ? {
          label: "Proceed to Cart",
          onClick: () => navigate(cartScreenFor(cart!.cartType)),
        }
      : null
  );

  return (
    <>
      <Breadcrumb section="Laboratory" step="Diagnostic Tests & Packages" />

      <div className="flex flex-col gap-space-lg pb-32">
        {/* Editorial Intro */}
        <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-space-lg shadow-sm md:p-space-xl">
          <div className="pointer-events-none absolute -top-20 -right-16 h-80 w-80 rounded-full bg-primary/5 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-secondary/5 blur-xl" />
          <div className="relative z-10 flex max-w-3xl flex-col gap-space-xs">
            <span className="font-label-md text-label-md font-semibold uppercase tracking-wide text-secondary">
              ISO 15189 &amp; NABL Accredited Facility
            </span>
            <h1 className="font-headline-lg text-headline-lg tracking-tight text-primary">
              Explore Clinical Laboratory Diagnostics
            </h1>
            <p className="mt-space-2xs font-body-md text-body-md leading-relaxed text-on-surface-variant">
              NABL-accredited precision blood &amp; biochemistry pathology. Choose verified comprehensive
              test profiles or individual biomarkers with transparent clinical turnaround times.
            </p>
          </div>

          {/* Category filter pills */}
          <div className="relative z-10 mt-space-lg flex flex-wrap items-center gap-space-xs">
            <button
              onClick={() => setLabCategory(null)}
              className={`whitespace-nowrap rounded-full px-space-md py-space-xs font-label-md text-label-md shadow-sm transition-all ${
                selectedCategory === null
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-primary"
              }`}
            >
              All Pathology
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setLabCategory(category)}
                className={`whitespace-nowrap rounded-full px-space-md py-space-xs font-label-md text-label-md shadow-sm transition-all ${
                  selectedCategory === category
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-primary"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Popular Packages */}
        {packages.length > 0 ? (
          <section className="flex flex-col gap-space-md">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="font-caption text-caption font-semibold uppercase tracking-wider text-secondary">
                  High Value Diagnostic Care
                </span>
                <h2 className="font-headline-md text-headline-md text-primary">
                  Popular Packages &amp; Multi-Organ Profiles
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-space-md md:grid-cols-3">
              {packages.map((pkg) => {
                const added = addedIds.has(pkg.id);
                return (
                  <article
                    key={pkg.id}
                    className="group flex flex-col justify-between rounded-xl bg-surface-container-lowest p-space-md shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="flex flex-col gap-space-sm">
                      <div className="flex items-center justify-between gap-space-xs">
                        <span className="inline-flex items-center gap-1 rounded-full bg-secondary-fixed px-space-sm py-space-2xs font-caption text-caption font-semibold text-on-secondary-fixed">
                          <span className="material-symbols-outlined text-[14px]">local_fire_department</span>
                          Package
                        </span>
                        {pkg.homeCollectionEligible ? (
                          <span className="rounded bg-surface-container-low px-space-xs py-space-2xs font-label-md text-caption font-medium text-on-surface-variant">
                            HOME ELIGIBLE
                          </span>
                        ) : null}
                      </div>
                      <div className="flex flex-col">
                        <h3 className="font-title-md text-title-md leading-tight text-primary transition-colors group-hover:text-secondary">
                          {pkg.name}
                        </h3>
                        <p className="mt-space-2xs font-caption text-caption text-on-surface-variant">
                          {pkg.category}
                        </p>
                      </div>
                    </div>
                    <div className="mt-space-sm flex items-center justify-between pt-space-md">
                      <div>
                        <span className="font-caption text-caption text-outline">Total Package</span>
                        <div className="font-headline-md text-headline-md font-bold leading-none text-primary">
                          ₹{pkg.price}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedLabTest(pkg.id);
                          navigate("LAB_ITEM_DETAIL");
                        }}
                        className="flex min-h-[48px] items-center gap-space-2xs rounded-lg bg-secondary px-space-md py-space-xs font-label-md text-label-md text-on-secondary shadow-[0_4px_14px_rgba(224,122,95,0.25)] transition-all hover:bg-secondary/90"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {added ? "check_circle" : "add_circle"}
                        </span>
                        <span>{added ? "View" : "View & Add"}</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* Individual tests list */}
        <section className="flex flex-col gap-space-md rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-md text-headline-md text-primary">Individual Tests</h2>
            <span className="font-caption text-caption text-on-surface-variant">
              {filteredTests.length} Tests in Catalogue
            </span>
          </div>
          {cartCount > 0 ? (
            <div className="flex items-center justify-between rounded-lg bg-surface-container-low px-space-sm py-space-xs">
              <span className="font-label-lg text-label-lg font-semibold text-primary">
                {cartCount === 1 ? "1 Test Selected" : `${cartCount} Tests Selected`}
              </span>
              <div className="flex items-center gap-space-xs">
                <span className="font-caption text-caption text-outline">Subtotal:</span>
                <span className="font-title-md text-title-md font-bold leading-none text-primary">
                  ₹{cartSubtotal}
                </span>
              </div>
            </div>
          ) : null}
          <div className="flex flex-col gap-space-xs">
            {filteredTests.map((test) => {
              const added = addedIds.has(test.id);
              const cartItemId = cart?.items.find((item) => item.labTestId === test.id)?.id;
              return (
                <div
                  key={test.id}
                  className="flex items-center justify-between gap-space-md rounded-lg bg-surface-container-low p-space-sm transition-colors hover:bg-surface-container"
                >
                  <button
                    onClick={() => {
                      setSelectedLabTest(test.id);
                      navigate("LAB_ITEM_DETAIL");
                    }}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate font-label-lg text-label-lg font-semibold text-primary">
                      {test.name}
                    </p>
                    <p className="font-caption text-caption text-on-surface-variant">{test.category}</p>
                  </button>
                  <div className="flex shrink-0 items-center gap-space-md">
                    <span className="font-title-md text-title-md font-bold text-primary">₹{test.price}</span>
                    <button
                      onClick={() =>
                        added && cartItemId
                          ? void removeItem(cartItemId)
                          : void addItem("LAB_TEST", test.id)
                      }
                      aria-label={added ? `Remove ${test.name}` : `Add ${test.name}`}
                      className={`rounded-lg px-space-sm py-space-2xs font-label-md text-caption transition-colors ${
                        added
                          ? "bg-success/20 text-success"
                          : "bg-surface-container-lowest text-primary shadow-sm hover:bg-primary hover:text-on-primary"
                      }`}
                    >
                      {added ? "Added" : "Add"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}
