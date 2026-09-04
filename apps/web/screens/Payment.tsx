"use client";

import { useState } from "react";
import { Button } from "../components/Button";
import { ScreenShell } from "../components/ScreenShell";
import { useWidgetStore } from "../lib/store";

const TABS = ["UPI", "Card", "Net Banking"] as const;

/** SC7 — Payment (Online), mocked. Failure returns the patient here to retry, never drops the booking. */
export function Payment() {
  const paymentAmount = useWidgetStore((s) => s.paymentAmount);
  const paymentFailureReason = useWidgetStore((s) => s.paymentFailureReason);
  const pay = useWidgetStore((s) => s.pay);
  const loading = useWidgetStore((s) => s.loading);
  const [tab, setTab] = useState<(typeof TABS)[number]>("UPI");
  const [simulateFailure, setSimulateFailure] = useState(false);

  return (
    <ScreenShell
      title="Payment"
      showBack={false}
      footer={
        <Button loading={loading} onClick={() => void pay(simulateFailure)}>
          Verify & Pay — ₹{paymentAmount}
        </Button>
      }
    >
      {paymentFailureReason ? (
        <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          Payment failed: {paymentFailureReason}. Please try again.
        </div>
      ) : null}

      <div className="mb-4 flex gap-2 rounded-xl bg-slate-100 p-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold ${
              tab === t ? "bg-white text-slate-900 shadow" : "text-slate-500"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "UPI" ? (
        <div className="space-y-3">
          <input
            placeholder="yourname@upi"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
          />
          <p className="text-center text-xs text-slate-400">or scan the QR code in your UPI app</p>
        </div>
      ) : tab === "Card" ? (
        <div className="space-y-3">
          <input
            placeholder="Card number"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
          />
          <div className="flex gap-2">
            <input
              placeholder="MM/YY"
              className="w-1/2 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />
            <input
              placeholder="CVV"
              className="w-1/2 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>
      ) : (
        <select className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500">
          <option>Select your bank</option>
        </select>
      )}

      <label className="mt-6 flex items-center gap-2 text-xs text-slate-400">
        <input
          type="checkbox"
          checked={simulateFailure}
          onChange={(e) => setSimulateFailure(e.target.checked)}
        />
        Simulate a payment failure (test)
      </label>
    </ScreenShell>
  );
}
