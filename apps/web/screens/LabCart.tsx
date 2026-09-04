"use client";

import { Button } from "../components/Button";
import { CartItemRow } from "../components/CartItemRow";
import { NudgeCard } from "../components/NudgeCard";
import { ScreenShell } from "../components/ScreenShell";
import { useWidgetStore } from "../lib/store";

/** L3 — Laboratory Cart. */
export function LabCart() {
  const cart = useWidgetStore((s) => s.cart);
  const navigate = useWidgetStore((s) => s.navigate);
  const items = cart?.items ?? [];

  return (
    <ScreenShell
      title="Your Laboratory Cart"
      footer={
        <Button disabled={items.length === 0} onClick={() => navigate("LAB_COLLECTION_TYPE")}>
          Continue
        </Button>
      }
    >
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">Your cart is empty.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <CartItemRow key={item.id} item={item} />
          ))}
        </div>
      )}

      <button
        onClick={() => navigate("LAB_CATEGORIES")}
        className="mt-3 w-full rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
      >
        + Add another test
      </button>

      <NudgeCard />

      {items.length > 0 ? (
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm font-semibold text-slate-900">
          <span>Subtotal</span>
          <span>₹{cart?.subtotal}</span>
        </div>
      ) : null}
    </ScreenShell>
  );
}
