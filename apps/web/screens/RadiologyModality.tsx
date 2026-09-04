"use client";

import { useEffect, useState } from "react";
import { ScreenShell } from "../components/ScreenShell";
import { api } from "../lib/apiClient";
import { useWidgetStore } from "../lib/store";
import type { Modality } from "../lib/types";

const MODALITY_LABELS: Record<Modality, string> = {
  ULTRASOUND: "Ultrasound",
  XRAY: "X-Ray",
  CT: "CT Scan",
  MRI: "MRI",
  ECG: "ECG",
};

/** R1 — Radiology Browse (Modality). */
export function RadiologyModality() {
  const orgSlug = useWidgetStore((s) => s.orgSlug);
  const setModality = useWidgetStore((s) => s.setModality);
  const navigate = useWidgetStore((s) => s.navigate);
  const [modalities, setModalities] = useState<Modality[]>([]);

  useEffect(() => {
    if (!orgSlug) return;
    api.radiologyModalities(orgSlug).then((res) => setModalities(res.modalities));
  }, [orgSlug]);

  return (
    <ScreenShell title="Radiology">
      <p className="mb-4 text-sm text-slate-500">What type of scan do you need?</p>
      <div className="grid grid-cols-2 gap-3">
        {modalities.map((modality) => (
          <button
            key={modality}
            onClick={() => {
              setModality(modality);
              navigate("RADIOLOGY_CATEGORY");
            }}
            className="rounded-2xl border border-slate-200 px-4 py-6 text-center text-sm font-semibold text-slate-800 hover:border-blue-300 hover:bg-blue-50"
          >
            {MODALITY_LABELS[modality]}
          </button>
        ))}
      </div>
    </ScreenShell>
  );
}
