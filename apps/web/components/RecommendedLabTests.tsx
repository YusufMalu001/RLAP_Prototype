"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/apiClient";
import { useWidgetStore } from "../lib/store";
import type { LabRecommendation } from "../lib/types";

/** LLM-backed (Gemini free tier, with a deterministic rule-based fallback) lab-test suggestions
 * complementary to whichever radiology exams are already in the cart — e.g. a contrast CT
 * surfaces a kidney function test. Shown only while there's something to suggest. */
export function RecommendedLabTests() {
  const cartToken = useWidgetStore((s) => s.cartToken);
  const cart = useWidgetStore((s) => s.cart);
  const addItem = useWidgetStore((s) => s.addItem);
  const [suggestions, setSuggestions] = useState<LabRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  const itemsKey = cart?.items.map((i) => i.id).join(",") ?? "";

  useEffect(() => {
    if (!cartToken) return;
    setLoading(true);
    api
      .labRecommendations(cartToken)
      .then((res) => setSuggestions(res.suggestions))
      .catch(() => setSuggestions([]))
      .finally(() => setLoading(false));
  }, [cartToken, itemsKey]);

  async function handleAdd(id: string) {
    setAddingId(id);
    await addItem("LAB_TEST", id);
    setAddingId(null);
  }

  if (!loading && suggestions.length === 0) return null;

  return (
    <div className="flex flex-col gap-space-md rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
      <div className="flex items-center gap-space-sm">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-tertiary-fixed text-on-tertiary-fixed-variant">
          <span className="material-symbols-outlined text-[20px]">neurology</span>
        </div>
        <div>
          <h2 className="font-title-md text-title-md font-semibold text-primary">
            Recommended Lab Tests
          </h2>
          <p className="font-caption text-caption text-on-surface-variant">
            Clinically complementary to your selected scans
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-space-xs">
          {[0, 1].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-surface-container-low" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-space-xs">
          {suggestions.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between gap-space-md rounded-lg bg-surface-container-low p-space-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-label-lg text-label-lg font-semibold text-primary">
                  {s.name}
                </p>
                <p className="font-caption text-caption text-on-surface-variant">{s.rationale}</p>
              </div>
              <div className="flex shrink-0 items-center gap-space-sm">
                <span className="font-label-lg text-label-lg font-bold text-primary">
                  ₹{s.price}
                </span>
                <button
                  disabled={addingId === s.id}
                  onClick={() => void handleAdd(s.id)}
                  aria-label={`Add ${s.name}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-container text-on-primary shadow-sm transition-all hover:bg-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {addingId === s.id ? "hourglass_top" : "add"}
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
