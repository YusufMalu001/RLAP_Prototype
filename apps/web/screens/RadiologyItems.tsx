"use client";

import { useEffect, useState } from "react";
import { Button } from "../components/Button";
import { ScreenShell } from "../components/ScreenShell";
import { api } from "../lib/apiClient";
import { cartScreenFor, useWidgetStore } from "../lib/store";
import type { RadiologyExamSummary } from "../lib/types";

/** R3 — Body Part — Item Selection. */
export function RadiologyItems() {
  const orgSlug = useWidgetStore((s) => s.orgSlug);
  const modality = useWidgetStore((s) => s.selectedModality);
  const category = useWidgetStore((s) => s.selectedCategory);
  const addItem = useWidgetStore((s) => s.addItem);
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

  return (
    <ScreenShell
      title="Select an exam"
      footer={
        <div className="space-y-2">
          {hasItems ? (
            <p className="text-center text-xs text-slate-400">{cart!.items.length} exam(s) added</p>
          ) : null}
          <Button
            disabled={!hasItems}
            loading={loading}
            onClick={() => navigate(cartScreenFor(cart?.cartType ?? null))}
          >
            Continue
          </Button>
        </div>
      }
    >
      <ul className="divide-y divide-slate-100">
        {exams.map((exam) => {
          const added = addedIds.has(exam.id);
          return (
            <li key={exam.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{exam.name}</p>
                <p className="text-xs text-slate-500">₹{exam.price}</p>
              </div>
              <button
                disabled={added}
                onClick={() => void addItem("RADIOLOGY_EXAM", exam.id)}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg font-semibold ${
                  added
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
                aria-label={added ? `${exam.name} added` : `Add ${exam.name}`}
              >
                {added ? "✓" : "+"}
              </button>
            </li>
          );
        })}
        {exams.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No exams found here.</p>
        ) : null}
      </ul>
    </ScreenShell>
  );
}
