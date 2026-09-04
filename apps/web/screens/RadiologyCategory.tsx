"use client";

import { useEffect, useState } from "react";
import { ScreenShell } from "../components/ScreenShell";
import { api } from "../lib/apiClient";
import { useWidgetStore } from "../lib/store";
import type { BodyPartCategory } from "../lib/types";

const CATEGORY_LABELS: Record<BodyPartCategory, string> = {
  HEAD_NECK: "Head & Neck",
  CHEST_CARDIAC: "Chest & Cardiac",
  ABDOMEN_PELVIS: "Abdomen & Pelvis",
  SPINE: "Spine",
  UPPER_LIMB: "Upper Limb",
  LOWER_LIMB: "Lower Limb",
  WHOLE_BODY: "Whole Body",
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
    <ScreenShell title="Select a body part">
      <div className="grid grid-cols-2 gap-3">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => {
              setCategory(category);
              navigate("RADIOLOGY_ITEMS");
            }}
            className="rounded-2xl border border-slate-200 px-4 py-6 text-center text-sm font-semibold text-slate-800 hover:border-blue-300 hover:bg-blue-50"
          >
            {CATEGORY_LABELS[category]}
          </button>
        ))}
      </div>
    </ScreenShell>
  );
}
