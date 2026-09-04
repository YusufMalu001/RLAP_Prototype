"use client";

import { Button } from "../components/Button";
import { ScreenShell } from "../components/ScreenShell";
import { useWidgetStore } from "../lib/store";

/** R6 / L5b / C2 — Centre Selection, one component parameterized by cartType. */
export function CentreSelection() {
  const centres = useWidgetStore((s) => s.centres);
  const centresLoading = useWidgetStore((s) => s.centresLoading);
  const cartType = useWidgetStore((s) => s.cart?.cartType);
  const selectCentre = useWidgetStore((s) => s.selectCentre);
  const splitIntoTwoBookings = useWidgetStore((s) => s.splitIntoTwoBookings);
  const loading = useWidgetStore((s) => s.loading);
  const navigate = useWidgetStore((s) => s.navigate);

  if (centresLoading) {
    return (
      <ScreenShell title="Finding centres">
        <p className="py-8 text-center text-sm text-slate-400">Looking for centres near you…</p>
      </ScreenShell>
    );
  }

  if (centres.length === 0) {
    const isCombined = cartType === "COMBINED";
    return (
      <ScreenShell title="No centres found">
        <div className="flex flex-col items-center py-8 text-center">
          <span className="mb-3 text-3xl">🏥</span>
          <p className="mb-1 text-sm font-semibold text-slate-800">
            {isCombined
              ? "No single centre offers everything in your combined cart."
              : "No centre nearby offers everything in your cart."}
          </p>
          <p className="mb-6 text-sm text-slate-500">
            {isCombined
              ? "You can split this into two separate bookings, or contact us for help."
              : "Try broadening your search, or contact us for help."}
          </p>
          <div className="w-full space-y-2">
            {isCombined ? (
              <Button loading={loading} onClick={() => void splitIntoTwoBookings()}>
                Split Into Two Bookings
              </Button>
            ) : (
              <Button onClick={() => navigate("LOCATION")}>Broaden Search</Button>
            )}
            <Button variant="secondary" onClick={() => navigate("HOME")}>
              Contact Support
            </Button>
          </div>
        </div>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title="Select a centre">
      <ul className="space-y-2">
        {centres.map((centre) => (
          <li key={centre.id}>
            <button
              disabled={loading}
              onClick={() => void selectCentre(centre.id)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50"
            >
              <p className="text-sm font-semibold text-slate-900">{centre.name}</p>
              <p className="text-xs text-slate-500">{centre.address}</p>
              {typeof centre.distanceKm === "number" ? (
                <p className="mt-1 text-xs font-medium text-blue-600">
                  {centre.distanceKm.toFixed(1)} km away
                </p>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </ScreenShell>
  );
}
