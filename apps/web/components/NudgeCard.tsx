"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/apiClient";
import { useWidgetStore } from "../lib/store";

/** R4/L3 cross-sell nudge (§4.2) — shown only while the cart holds exactly one item type. */
export function NudgeCard() {
  const cartToken = useWidgetStore((s) => s.cartToken);
  const navigate = useWidgetStore((s) => s.navigate);
  const [direction, setDirection] = useState<"SUGGEST_LAB" | "SUGGEST_RADIOLOGY" | null>(null);

  useEffect(() => {
    if (!cartToken) return;
    api
      .nudge(cartToken)
      .then((res) => setDirection(res.showNudge ? res.direction : null))
      .catch(() => setDirection(null));
  }, [cartToken]);

  if (!direction) return null;

  const isSuggestLab = direction === "SUGGEST_LAB";

  return (
    <button
      onClick={() => navigate(isSuggestLab ? "LAB_CATEGORIES" : "RADIOLOGY_MODALITY")}
      className="mt-3 flex w-full items-center justify-between gap-2 rounded-xl border border-dashed border-blue-300 bg-blue-50 px-4 py-3 text-left text-sm text-blue-800 hover:bg-blue-100"
    >
      <span>
        {isSuggestLab
          ? "Doctor also mentioned a lab test? Add it here"
          : "Doctor also mentioned a scan? Add it here"}
      </span>
      <span aria-hidden>→</span>
    </button>
  );
}
