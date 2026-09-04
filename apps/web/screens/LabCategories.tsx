"use client";

import { useEffect, useState } from "react";
import { ScreenShell } from "../components/ScreenShell";
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

  return (
    <ScreenShell title="Laboratory">
      {packages.length > 0 ? (
        <section className="mb-5">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Curated Packages
          </h2>
          <div className="space-y-2">
            {packages.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => {
                  setSelectedLabTest(pkg.id);
                  navigate("LAB_ITEM_DETAIL");
                }}
                className="flex w-full items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-left"
              >
                <span className="text-sm font-medium text-slate-900">{pkg.name}</span>
                <span className="text-sm font-semibold text-blue-700">₹{pkg.price}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setLabCategory(null)}
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${
            selectedCategory === null ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
          }`}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setLabCategory(category)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              selectedCategory === category
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {category}
          </button>
        ))}
      </section>

      <ul className="divide-y divide-slate-100">
        {tests
          .filter((test) => !test.isPackage)
          .map((test) => {
            const added = addedIds.has(test.id);
            return (
              <li key={test.id} className="flex items-center justify-between gap-3 py-3">
                <button
                  onClick={() => {
                    setSelectedLabTest(test.id);
                    navigate("LAB_ITEM_DETAIL");
                  }}
                  className="min-w-0 text-left"
                >
                  <p className="truncate text-sm font-medium text-slate-900">{test.name}</p>
                  <p className="text-xs text-slate-500">₹{test.price}</p>
                </button>
                <button
                  disabled={added}
                  onClick={() => void addItem("LAB_TEST", test.id)}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg font-semibold ${
                    added
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                  aria-label={added ? `${test.name} added` : `Add ${test.name}`}
                >
                  {added ? "✓" : "+"}
                </button>
              </li>
            );
          })}
      </ul>

      {(cart?.items.length ?? 0) > 0 ? (
        <button
          onClick={() => navigate(cartScreenFor(cart!.cartType))}
          className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
        >
          View Cart ({cart!.items.length})
        </button>
      ) : null}
    </ScreenShell>
  );
}
