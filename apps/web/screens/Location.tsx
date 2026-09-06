"use client";

import { useState } from "react";
import { Breadcrumb } from "../components/AppHeader";
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

  const canContinue = Boolean(city && area);

  return (
    <>
      <Breadcrumb section="Booking" step="Location" sessionLabel="Step 2 of 4" />

      <div className="relative mx-auto flex w-full max-w-[620px] flex-col items-center text-center">
        <div className="mb-space-sm inline-flex items-center gap-2 rounded-full bg-surface-container-highest/70 px-space-sm py-1 text-on-surface-variant shadow-sm">
          <span className="material-symbols-outlined text-[17px] text-secondary">
            share_location
          </span>
          <span className="font-caption text-caption text-[11px] font-semibold uppercase tracking-wider text-on-surface">
            Spatial Suite Assignment
          </span>
        </div>
        <h1 className="text-balance font-headline-lg text-headline-lg tracking-tight text-primary">
          Where would you like to take your scan?
        </h1>
        <p className="mt-space-xs max-w-xl text-balance font-body-md text-body-md text-on-surface-variant">
          We&apos;ll match you with the closest accredited diagnostic centre equipped with
          certified sonography suites.
        </p>

        <div className="relative mt-space-xl w-full overflow-hidden rounded-xl bg-surface-container-lowest p-space-md text-left shadow-[0_4px_24px_rgba(22,59,72,0.06),0_12px_48px_rgba(22,59,72,0.04)] sm:p-card-pad-lg">
          <button
            onClick={useCurrentLocation}
            disabled={locating}
            className="group flex min-h-[56px] w-full items-center justify-between rounded-lg bg-primary-container px-space-md py-3.5 text-on-primary shadow-md transition-all duration-200 hover:bg-primary active:scale-[0.99] disabled:opacity-60"
            type="button"
          >
            <div className="flex min-w-0 items-center gap-space-sm">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary-fixed-dim opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-secondary-container" />
              </span>
              <div className="flex items-center gap-1.5 truncate">
                <span className="material-symbols-outlined text-[20px] text-primary-fixed">
                  my_location
                </span>
                <span className="truncate font-label-lg text-label-lg font-semibold tracking-tight text-on-primary">
                  {locating ? "Acquiring calibrated coordinates…" : "Use My Current Location"}
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined shrink-0 text-[20px] text-on-primary/70 transition-transform group-hover:translate-x-0.5">
              near_me
            </span>
          </button>
          <div className="mt-2.5 flex items-center justify-center gap-2 text-center">
            <span className="material-symbols-outlined text-[15px] text-outline">lock</span>
            <span className="font-caption text-caption text-[12px] text-on-surface-variant">
              Encrypted GPS matching • Accurate within 50 meters
            </span>
          </div>
          {geoError ? (
            <p className="mt-2 text-center font-caption text-caption text-error">{geoError}</p>
          ) : null}

          <div className="relative my-space-lg flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="h-px w-full bg-surface-container-highest" />
            </div>
            <span className="relative bg-surface-container-lowest px-space-sm font-caption text-caption text-[11px] font-bold uppercase tracking-widest text-outline">
              OR SELECT MANUALLY
            </span>
          </div>

          <div className="flex flex-col gap-space-md">
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md font-semibold text-on-surface">
                City / Metropolitan Region
              </label>
              <div className="relative">
                <select
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setArea("");
                  }}
                  className="h-[52px] w-full cursor-pointer appearance-none rounded-lg bg-surface-container-low pl-space-md pr-10 font-body-md text-body-md text-on-surface transition-all focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary-container"
                >
                  <option value="">Select City</option>
                  {Object.keys(CITY_AREAS).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[22px]">
                    keyboard_arrow_down
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md font-semibold text-on-surface">
                Locality / Area
              </label>
              <div className="relative">
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  disabled={!city}
                  className="h-[52px] w-full cursor-pointer appearance-none rounded-lg bg-surface-container-low pl-space-md pr-10 font-body-md text-body-md text-on-surface transition-all focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary-container disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">Select Area</option>
                  {(CITY_AREAS[city] ?? []).map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[22px]">
                    keyboard_arrow_down
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-space-xs">
              <button
                disabled={!canContinue || loading}
                onClick={async () => {
                  await setLocation({ city, area });
                  navigate("CENTRE_SELECTION");
                }}
                className="flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-space-xs rounded-lg bg-secondary font-label-lg text-label-lg text-on-secondary shadow-[0_4px_14px_rgba(154,68,45,0.25)] transition-all hover:bg-on-secondary-container active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
              >
                <span>{loading ? "Searching…" : "Search Centres in this Area"}</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-space-xl grid w-full grid-cols-1 gap-space-sm text-left sm:grid-cols-3">
          <div className="flex items-start gap-space-xs rounded-xl bg-surface-container-lowest p-space-sm shadow-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-fixed">
              <span className="material-symbols-outlined text-[18px] text-primary">badge</span>
            </div>
            <div>
              <div className="font-label-md text-label-md font-semibold text-on-surface">
                Sonologists On-Site
              </div>
              <div className="font-caption text-caption text-[12px] text-on-surface-variant">
                MD Radiologist reviews live
              </div>
            </div>
          </div>
          <div className="flex items-start gap-space-xs rounded-xl bg-surface-container-lowest p-space-sm shadow-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary-fixed">
              <span className="material-symbols-outlined text-[18px] text-secondary">
                access_time
              </span>
            </div>
            <div>
              <div className="font-label-md text-label-md font-semibold text-on-surface">
                Zero Hallway Waits
              </div>
              <div className="font-caption text-caption text-[12px] text-on-surface-variant">
                10-minute pre-booked gates
              </div>
            </div>
          </div>
          <div className="flex items-start gap-space-xs rounded-xl bg-surface-container-lowest p-space-sm shadow-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-container-highest">
              <span className="material-symbols-outlined text-[18px] text-primary">
                cloud_done
              </span>
            </div>
            <div>
              <div className="font-label-md text-label-md font-semibold text-on-surface">
                Sync to Cloud PACS
              </div>
              <div className="font-caption text-caption text-[12px] text-on-surface-variant">
                Direct push to your doctor
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
