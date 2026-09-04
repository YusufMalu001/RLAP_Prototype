"use client";

import { ScreenShell } from "../components/ScreenShell";
import { SearchBar } from "../components/SearchBar";
import { useWidgetStore } from "../lib/store";

const TILES = [
  { key: "RADIOLOGY_MODALITY" as const, label: "Radiology", hint: "Scans & imaging", icon: "🩻" },
  { key: "LAB_CATEGORIES" as const, label: "Laboratory", hint: "Blood & sample tests", icon: "🧪" },
  {
    key: "UPLOAD_PRESCRIPTION" as const,
    label: "Upload Prescription",
    hint: "Let us read it for you",
    icon: "📄",
  },
];

/** G0 — Entry / Home. */
export function Home() {
  const navigate = useWidgetStore((s) => s.navigate);
  const reset = useWidgetStore((s) => s.reset);

  return (
    <ScreenShell title="Book an appointment" showBack={false} onClose={() => reset()}>
      <SearchBar />
      <div className="mt-6 grid grid-cols-1 gap-3">
        {TILES.map((tile) => (
          <button
            key={tile.key}
            onClick={() => navigate(tile.key)}
            className="flex items-center gap-4 rounded-2xl border border-slate-200 px-4 py-4 text-left hover:border-blue-300 hover:bg-blue-50"
          >
            <span className="text-2xl">{tile.icon}</span>
            <span>
              <span className="block text-sm font-semibold text-slate-900">{tile.label}</span>
              <span className="block text-xs text-slate-500">{tile.hint}</span>
            </span>
          </button>
        ))}
      </div>
    </ScreenShell>
  );
}
