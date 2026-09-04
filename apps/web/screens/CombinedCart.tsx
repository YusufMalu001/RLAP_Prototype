"use client";

import { Button } from "../components/Button";
import { CartItemRow } from "../components/CartItemRow";
import { ScreenShell } from "../components/ScreenShell";
import { useWidgetStore } from "../lib/store";

/** C1 — Combined Cart: two clearly separated sections, one Continue. */
export function CombinedCart() {
  const cart = useWidgetStore((s) => s.cart);
  const navigate = useWidgetStore((s) => s.navigate);
  const items = cart?.items ?? [];
  const radiologyItems = items.filter((i) => i.itemType === "RADIOLOGY_EXAM");
  const labItems = items.filter((i) => i.itemType === "LAB_TEST");

  return (
    <ScreenShell
      title="Your Combined Booking"
      footer={<Button onClick={() => navigate("LOCATION")}>Continue</Button>}
    >
      <section className="mb-5">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Radiology
        </h2>
        <div className="space-y-2">
          {radiologyItems.map((item) => (
            <CartItemRow key={item.id} item={item} />
          ))}
        </div>
      </section>

      <section className="mb-4">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Laboratory
        </h2>
        <div className="space-y-2">
          {labItems.map((item) => (
            <CartItemRow key={item.id} item={item} />
          ))}
        </div>
      </section>

      <p className="mb-4 rounded-xl bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
        Your lab sample will be collected at the centre during your visit — home collection
        isn&apos;t available for combined bookings.
      </p>

      <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-sm font-semibold text-slate-900">
        <span>Subtotal</span>
        <span>₹{cart?.subtotal}</span>
      </div>
    </ScreenShell>
  );
}
