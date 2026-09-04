"use client";

import { useState } from "react";
import { Button } from "../components/Button";
import { ScreenShell } from "../components/ScreenShell";
import { useWidgetStore } from "../lib/store";

// Matches the seeded Vijaya Diagnostics catalogue — a real deployment would drive this from
// the org's own centre list rather than a hardcoded set.
const CITY_AREAS: Record<string, string[]> = {
  Hyderabad: ["Ameerpet", "Banjara Hills", "Kukatpally"],
};

/** R5 — City / Location Capture (shared across Radiology, Lab, Combined). */
export function Location() {
  const setLocation = useWidgetStore((s) => s.setLocation);
  const navigate = useWidgetStore((s) => s.navigate);
  const loading = useWidgetStore((s) => s.loading);
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [geoError, setGeoError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setGeoError("Geolocation isn't available on this device.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLocating(false);
        await setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        navigate("CENTRE_SELECTION");
      },
      () => {
        setLocating(false);
        setGeoError("Couldn't get your location — try selecting a city instead.");
      },
    );
  }

  const canContinue = city && area;

  return (
    <ScreenShell
      title="Where should we look?"
      footer={
        <Button
          disabled={!canContinue}
          loading={loading}
          onClick={async () => {
            await setLocation({ city, area });
            navigate("CENTRE_SELECTION");
          }}
        >
          Continue
        </Button>
      }
    >
      <button
        onClick={useCurrentLocation}
        disabled={locating}
        className="w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
      >
        {locating ? "Locating…" : "📍 Use My Current Location"}
      </button>
      {geoError ? <p className="mt-2 text-xs text-red-600">{geoError}</p> : null}

      <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
        <div className="h-px flex-1 bg-slate-200" />
        or choose manually
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <label className="mb-1 block text-xs font-medium text-slate-500">City</label>
      <select
        value={city}
        onChange={(e) => {
          setCity(e.target.value);
          setArea("");
        }}
        className="mb-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
      >
        <option value="">Select City</option>
        {Object.keys(CITY_AREAS).map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <label className="mb-1 block text-xs font-medium text-slate-500">Area</label>
      <select
        value={area}
        onChange={(e) => setArea(e.target.value)}
        disabled={!city}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-50"
      >
        <option value="">Select Area</option>
        {(CITY_AREAS[city] ?? []).map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>
    </ScreenShell>
  );
}
