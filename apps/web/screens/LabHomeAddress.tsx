"use client";

import { useState } from "react";
import { Button } from "../components/Button";
import { ScreenShell } from "../components/ScreenShell";
import { useWidgetStore } from "../lib/store";

/** L5a — Home Address & PIN Validation. */
export function LabHomeAddress() {
  const checkPin = useWidgetStore((s) => s.checkPin);
  const saveHomeAddress = useWidgetStore((s) => s.saveHomeAddress);
  const pinCheck = useWidgetStore((s) => s.pinCheck);
  const navigate = useWidgetStore((s) => s.navigate);
  const loading = useWidgetStore((s) => s.loading);

  const [pin, setPin] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [street, setStreet] = useState("");
  const [landmark, setLandmark] = useState("");

  const pinChecked = pinCheck !== null && pin.length === 6;
  const canContinue = pinChecked && pinCheck?.serviceable && houseNumber.trim() && street.trim();

  return (
    <ScreenShell
      title="Home Sample Collection"
      footer={
        pinCheck?.serviceable ? (
          <Button
            disabled={!canContinue}
            loading={loading}
            onClick={() =>
              void saveHomeAddress({
                pinCode: pin,
                houseNumber,
                street,
                landmark: landmark || undefined,
              })
            }
          >
            Continue
          </Button>
        ) : undefined
      }
    >
      <label className="mb-1 block text-xs font-medium text-slate-500">PIN Code</label>
      <div className="flex gap-2">
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="6-digit PIN"
          className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
        />
        <button
          disabled={pin.length !== 6 || loading}
          onClick={() => void checkPin(pin)}
          className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
        >
          Check Availability
        </button>
      </div>

      {pinCheck && pin.length === 6 ? (
        pinCheck.serviceable ? (
          <div className="mt-4 space-y-3">
            <p className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
              Serviceable — home collection charge ₹{pinCheck.homeCollectionCharge}
            </p>
            <input
              value={houseNumber}
              onChange={(e) => setHouseNumber(e.target.value)}
              placeholder="House / Flat No."
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />
            <input
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="Street / Locality"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />
            <input
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="Landmark (optional)"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">
              This PIN isn&apos;t serviceable for home collection yet.
            </p>
            <button
              onClick={() => navigate("LOCATION")}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Find Nearest Centre Instead
            </button>
          </div>
        )
      ) : null}
    </ScreenShell>
  );
}
