"use client";

import { useWidgetStore } from "../lib/store";
import type { CartItem } from "../lib/types";

/** §3.5 — HIGH-confidence OCR rows are tagged "From prescription"; LOW-confidence get an amber outline. */
export function CartItemRow({ item }: { item: CartItem }) {
  const removeItem = useWidgetStore((s) => s.removeItem);
  const isLowConfidence = item.source === "OCR" && item.ocrConfidence === "LOW";

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${
        isLowConfidence ? "border-amber-400 bg-amber-50" : "border-slate-100 bg-white"
      }`}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-900">{item.name}</p>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className="text-xs text-slate-500">₹{item.price}</span>
          {item.source === "OCR" ? (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                isLowConfidence ? "bg-amber-200 text-amber-800" : "bg-blue-100 text-blue-700"
              }`}
            >
              {isLowConfidence ? "Confirm this match" : "From prescription"}
            </span>
          ) : null}
        </div>
      </div>
      {item.itemType !== "HOME_COLLECTION_CHARGE" ? (
        <button
          onClick={() => void removeItem(item.id)}
          aria-label={`Remove ${item.name}`}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          ✕
        </button>
      ) : null}
    </div>
  );
}
