"use client";

import { useEffect, useState } from "react";
import { Breadcrumb } from "../components/AppHeader";
import { api } from "../lib/apiClient";
import { useWidgetStore } from "../lib/store";
import type { BodyPartCategory, Modality } from "../lib/types";

const CATEGORY_LABELS: Record<BodyPartCategory, string> = {
  HEAD_NECK: "Head & Neck",
  CHEST_CARDIAC: "Chest & Cardiac",
  ABDOMEN_PELVIS: "Abdomen & Pelvis",
  SPINE: "Spine & Musculoskeletal",
  UPPER_LIMB: "Upper Limb",
  LOWER_LIMB: "Lower Limb",
  WHOLE_BODY: "Whole Body & Systemic",
};

const CATEGORY_META: Record<
  BodyPartCategory,
  { icon: string; hint: string; duration: string; tag: string }
> = {
  HEAD_NECK: {
    icon: "face",
    hint: "Thyroid, carotid Doppler, cervical lymph nodes & salivary glands.",
    duration: "15–25 mins",
    tag: "No Fasting Required",
  },
  CHEST_CARDIAC: {
    icon: "cardiology",
    hint: "Echocardiography, pleural space assessment & chest wall imaging.",
    duration: "30–40 mins",
    tag: "Cardiologist Supervision",
  },
  ABDOMEN_PELVIS: {
    icon: "vital_signs",
    hint: "Liver, gallbladder, kidneys, bladder & reproductive organs.",
    duration: "20–30 mins",
    tag: "Fasting typically needed",
  },
  SPINE: {
    icon: "accessibility_new",
    hint: "Joints, tendons, soft tissue lumps, ligaments & nerve tracking.",
    duration: "20–35 mins",
    tag: "Dynamic Motion Protocol",
  },
  UPPER_LIMB: {
    icon: "front_hand",
    hint: "Shoulder, elbow, wrist Doppler & arterial/venous vascular map.",
    duration: "15–30 mins",
    tag: "Color Doppler Capable",
  },
  LOWER_LIMB: {
    icon: "directions_walk",
    hint: "Venous Doppler (DVT check), arterial flow, knee & ankle scans.",
    duration: "20–40 mins",
    tag: "DVT Urgency Fast-Track",
  },
  WHOLE_BODY: {
    icon: "health_and_safety",
    hint: "Comprehensive multi-organ surveillance & executive screening.",
    duration: "60–75 mins",
    tag: "Executive Protocol",
  },
};

const MODALITY_LABELS: Record<Modality, string> = {
  ULTRASOUND: "Ultrasound (USG)",
  XRAY: "X-Ray",
  CT: "CT Scan",
  MRI: "MRI",
  ECG: "ECG",
};

/** R2 — Body Part — Category. */
export function RadiologyCategory() {
  const orgSlug = useWidgetStore((s) => s.orgSlug);
  const modality = useWidgetStore((s) => s.selectedModality);
  const setCategory = useWidgetStore((s) => s.setCategory);
  const navigate = useWidgetStore((s) => s.navigate);
  const [categories, setCategories] = useState<BodyPartCategory[]>([]);

  useEffect(() => {
    if (!orgSlug || !modality) return;
    api.radiologyCategories(orgSlug, modality).then((res) => setCategories(res.categories));
  }, [orgSlug, modality]);

  return (
    <>
      <Breadcrumb
        section="Radiology"
        step="Select Body Region"
        sessionLabel={modality ? MODALITY_LABELS[modality] : undefined}
      />

      <header className="mb-space-xl max-w-3xl">
        <div className="mb-space-xs inline-flex items-center gap-space-xs rounded-full bg-primary-fixed/40 px-space-sm py-1 text-on-primary-fixed">
          <span className="material-symbols-outlined text-[15px] text-primary">sensors</span>
          <span className="font-caption text-caption font-semibold uppercase tracking-wide">
            {modality ? MODALITY_LABELS[modality] : "Radiology"} — Select Body Region
          </span>
        </div>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary tracking-tight md:font-headline-lg md:text-headline-lg">
          Which area needs to be examined?
        </h1>
        <p className="mt-space-xs font-body-lg text-body-lg text-on-surface-variant">
          Select the target anatomical area from your referral — we&apos;ll tailor preparation
          instructions automatically.
        </p>
      </header>

      <section className="mb-space-2xl grid grid-cols-1 gap-space-md md:grid-cols-2">
        {categories.map((category) => {
          const meta = CATEGORY_META[category];
          return (
            <button
              key={category}
              onClick={() => {
                setCategory(category);
                navigate("RADIOLOGY_ITEMS");
              }}
              className="group relative flex flex-col justify-between overflow-hidden rounded-xl bg-surface-container-lowest p-space-lg text-left shadow-sm transition-all duration-200 hover:shadow-md"
            >
              <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-bl-full bg-primary/5 transition-transform duration-300 group-hover:scale-110" />
              <div>
                <div className="mb-space-sm flex items-start justify-between gap-space-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container text-primary">
                    <span className="material-symbols-outlined text-[26px]">{meta.icon}</span>
                  </div>
                  <span className="rounded bg-surface-container-low px-space-xs py-0.5 font-caption text-caption text-[11px] font-medium text-on-surface-variant">
                    {meta.tag}
                  </span>
                </div>
                <h3 className="mb-space-xs font-headline-sm text-headline-sm text-primary transition-colors group-hover:text-secondary">
                  {CATEGORY_LABELS[category]}
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">{meta.hint}</p>
              </div>
              <div className="flex items-center justify-between pt-space-sm">
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
        {categories.length === 0 ? (
          <p className="col-span-full py-space-xl text-center font-body-md text-body-md text-on-surface-variant">
            Loading body regions…
          </p>
        ) : null}
      </section>
    </>
  );
}
