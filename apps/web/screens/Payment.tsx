"use client";

import { useState } from "react";
import { Breadcrumb } from "../components/AppHeader";
import { usePrimaryAction } from "../components/PrimaryAction";
import { useWidgetStore } from "../lib/store";

const TABS = [
  { id: "UPI", label: "UPI (Instant)", icon: "qr_code_scanner" },
  { id: "Card", label: "Credit / Debit", icon: "credit_card" },
  { id: "Net Banking", label: "Net Banking", icon: "account_balance" },
] as const;

/** SC7 — Payment (Online), mocked. Failure returns the patient here to retry, never drops the booking. */
export function Payment() {
  const paymentAmount = useWidgetStore((s) => s.paymentAmount);
  const paymentFailureReason = useWidgetStore((s) => s.paymentFailureReason);
  const pay = useWidgetStore((s) => s.pay);
  const loading = useWidgetStore((s) => s.loading);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("UPI");
  const [simulateFailure, setSimulateFailure] = useState(false);

  usePrimaryAction({
    label: `Verify & Pay ₹${paymentAmount ?? 0}`,
    onClick: () => void pay(simulateFailure),
    disabled: loading,
  });

  return (
    <>
      <Breadcrumb section="Checkout" step="Payment Gateway" sessionLabel="Secure Online Payment" />
      <div className="grid w-full grid-cols-1 items-start gap-space-lg lg:grid-cols-12">
        {/* Left: payment engine */}
        <div className="flex flex-col gap-space-md lg:col-span-7">
          <div className="relative flex items-center justify-between overflow-hidden rounded-xl bg-primary p-space-md text-on-primary shadow-md">
            <div className="pointer-events-none absolute -bottom-6 -right-6 h-28 w-28 rounded-full bg-surface-tint/20 blur-2xl" />
            <div className="flex flex-col">
              <span className="font-caption text-caption uppercase tracking-wider text-primary-fixed-dim">
                Total Diagnostic Invoice
              </span>
              <span className="font-headline-md text-headline-md text-on-primary">₹{paymentAmount ?? 0}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="flex items-center gap-space-2xs font-caption text-caption text-primary-fixed-dim">
                <span className="material-symbols-outlined text-[14px] text-secondary-fixed">lock</span>
                256-Bit Encrypted
              </span>
            </div>
          </div>

          {paymentFailureReason ? (
            <div className="rounded-xl border border-error bg-error-container/40 px-space-md py-space-sm text-body-md text-on-error-container">
              <div className="flex items-center gap-space-xs font-semibold">
                <span className="material-symbols-outlined text-[18px]">error</span>
                Payment Failed
              </div>
              <div className="mt-1 text-sm">{paymentFailureReason}. Please try again.</div>
            </div>
          ) : null}

          <div className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
            <div className="grid grid-cols-3 gap-space-2xs bg-surface-container-low p-space-2xs">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center justify-center gap-space-2xs rounded-lg px-space-xs py-space-sm text-center font-label-md text-label-md transition-all ${
                    tab === t.id
                      ? "bg-surface-container-lowest text-primary shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] text-secondary">{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-space-lg p-space-lg">
              {tab === "UPI" ? (
                <div className="flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between">
                    <label className="font-label-lg text-label-lg text-primary">Pay via UPI ID / VPA</label>
                    <span className="font-caption text-caption text-on-surface-variant">
                      Real-time instant routing
                    </span>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-space-sm top-1/2 -translate-y-1/2 text-[18px] text-outline">
                      alternate_email
                    </span>
                    <input
                      placeholder="yourname@upi"
                      className="font-body-md h-12 w-full rounded-lg bg-surface-container-low pl-10 pr-space-sm text-body-md text-on-surface outline-none transition-all focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <p className="pt-space-xs text-center font-body-md text-body-md text-on-surface-variant">
                    or scan the QR code in your UPI app
                  </p>
                </div>
              ) : tab === "Card" ? (
                <div className="flex flex-col gap-space-md">
                  <div className="flex flex-col gap-space-2xs">
                    <label className="font-label-lg text-label-lg text-primary">Card Number</label>
                    <input
                      placeholder="1234 5678 9012 3456"
                      className="font-body-md h-12 w-full rounded-lg bg-surface-container-low px-space-sm text-body-md text-on-surface outline-none transition-all focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="flex gap-space-sm">
                    <div className="w-1/2">
                      <label className="mb-space-2xs block font-label-lg text-label-lg text-primary">Expiry</label>
                      <input
                        placeholder="MM/YY"
                        className="font-body-md h-12 w-full rounded-lg bg-surface-container-low px-space-sm text-body-md text-on-surface outline-none transition-all focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="w-1/2">
                      <label className="mb-space-2xs block font-label-lg text-label-lg text-primary">CVV</label>
                      <input
                        placeholder="123"
                        className="font-body-md h-12 w-full rounded-lg bg-surface-container-low px-space-sm text-body-md text-on-surface outline-none transition-all focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-space-2xs">
                  <label className="font-label-lg text-label-lg text-primary">Select Bank</label>
                  <select className="font-body-md h-12 w-full rounded-lg bg-surface-container-low px-space-sm text-body-md text-on-surface outline-none transition-all focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary">
                    <option>Select your bank</option>
                    <option>HDFC Bank</option>
                    <option>ICICI Bank</option>
                    <option>State Bank of India</option>
                  </select>
                </div>
              )}

              <label className="flex items-center gap-space-xs font-label-md text-label-md text-on-surface-variant">
                <input
                  type="checkbox"
                  checked={simulateFailure}
                  onChange={(e) => setSimulateFailure(e.target.checked)}
                  className="cursor-pointer"
                />
                Simulate a payment failure (test)
              </label>
            </div>
          </div>
        </div>

        {/* Right: reassurance */}
        <div className="flex flex-col gap-space-md lg:col-span-5">
          <div className="flex flex-col gap-space-sm rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
            <span className="font-caption text-caption uppercase tracking-wider text-outline">
              Clinical Payment Compliance
            </span>
            <div className="grid grid-cols-3 gap-space-xs text-center">
              {[
                ["account_balance", "RBI Authorized", "Payment Aggregator"],
                ["security", "PCI-DSS v4.0", "Level 1 Certified"],
                ["shield_locked", "256-Bit SSL", "End-to-End Encrypted"],
              ].map(([icon, title, subtitle]) => (
                <div
                  key={title}
                  className="flex flex-col items-center gap-space-2xs rounded-lg bg-surface-container-low p-space-xs"
                >
                  <span className="material-symbols-outlined text-[20px] text-primary">{icon}</span>
                  <span className="font-caption text-caption font-medium leading-none text-on-surface">
                    {title}
                  </span>
                  <span className="font-caption text-[11px] text-outline">{subtitle}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-space-sm rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary-fixed/50 text-secondary">
              <span className="material-symbols-outlined text-[18px]">verified</span>
            </div>
            <div className="flex flex-col gap-space-2xs">
              <h4 className="font-label-md text-label-md text-primary">100% Guaranteed Refund Policy</h4>
              <p className="font-caption text-caption text-on-surface-variant">
                Free cancellation and automatic refund up to 2 hours before your scheduled appointment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
