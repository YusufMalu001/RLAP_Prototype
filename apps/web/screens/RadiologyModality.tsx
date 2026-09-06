"use client";

import { useEffect, useState } from "react";
import { Breadcrumb } from "../components/AppHeader";
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

const MODALITY_META: Record<Modality, { icon: string; hint: string; duration: string }> = {
  ULTRASOUND: {
    icon: "vital_signs",
    hint: "Acoustic sonography — soft tissue, organs & vascular flow",
    duration: "15–75 mins",
  },
  XRAY: {
    icon: "radiology",
    hint: "Fast digital radiography for bones, chest & joints",
    duration: "5–15 mins",
  },
  CT: {
    icon: "3d_rotation",
    hint: "Cross-sectional imaging for detailed internal structures",
    duration: "10–30 mins",
  },
  MRI: {
    icon: "biotech",
    hint: "High-resolution magnetic imaging, no radiation",
    duration: "30–60 mins",
  },
  ECG: {
    icon: "ecg",
    hint: "Cardiac electrical activity & rhythm assessment",
    duration: "10–15 mins",
  },
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
    <>
      <Breadcrumb section="Radiology" step="Select Modality" />

      <header className="mb-space-xl max-w-3xl">
        <div className="mb-space-xs inline-flex items-center gap-space-xs rounded-full bg-primary-fixed/40 px-space-sm py-1 text-on-primary-fixed">
          <span className="material-symbols-outlined text-[15px] text-primary">sensors</span>
          <span className="font-caption text-caption font-semibold uppercase tracking-wide">
            Imaging Suite
          </span>
        </div>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary tracking-tight md:font-headline-lg md:text-headline-lg">
          What type of scan do you need?
        </h1>
        <p className="mt-space-xs font-body-lg text-body-lg text-on-surface-variant">
          Select the imaging modality indicated in your clinical referral. We&apos;ll narrow down
          the exact body region next.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-space-md sm:grid-cols-2 lg:grid-cols-3">
        {modalities.map((modality) => {
          const meta = MODALITY_META[modality];
          return (
            <button
              key={modality}
              onClick={() => {
                setModality(modality);
                navigate("RADIOLOGY_CATEGORY");
              }}
              className="group relative flex flex-col justify-between overflow-hidden rounded-xl bg-surface-container-lowest p-space-lg text-left shadow-sm transition-all duration-200 hover:shadow-md"
            >
              <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-bl-full bg-primary/5 transition-transform duration-300 group-hover:scale-110" />
              <div>
                <div className="mb-space-sm flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container text-on-primary shadow-sm">
                  <span className="material-symbols-outlined text-[26px]">{meta.icon}</span>
                </div>
                <h3 className="mb-space-xs font-headline-sm text-headline-sm text-primary transition-colors group-hover:text-secondary">
                  {MODALITY_LABELS[modality]}
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">{meta.hint}</p>
              </div>
              <div className="flex items-center justify-between pt-space-md">
                <div className="flex items-center gap-space-xs font-caption text-caption text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px] text-outline">
                    timelapse
                  </span>
                  <span>{meta.duration}</span>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-low text-primary transition-colors group-hover:bg-secondary group-hover:text-on-secondary">
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </span>
              </div>
            </button>
          );
        })}
      </section>
    </>
  );
}
