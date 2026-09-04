"use client";

import { useEffect, useState } from "react";
import { Button } from "../components/Button";
import { ScreenShell } from "../components/ScreenShell";
import { api } from "../lib/apiClient";
import { cartScreenFor, useWidgetStore } from "../lib/store";
import type { LabTestDetail } from "../lib/types";

/** L2 — Test / Package Detail. */
export function LabItemDetail() {
  const orgSlug = useWidgetStore((s) => s.orgSlug);
  const testId = useWidgetStore((s) => s.selectedLabTestId);
  const addItem = useWidgetStore((s) => s.addItem);
  const navigate = useWidgetStore((s) => s.navigate);
  const loading = useWidgetStore((s) => s.loading);
  const [test, setTest] = useState<LabTestDetail | null>(null);

  useEffect(() => {
    if (!orgSlug || !testId) return;
    api.labTestDetail(orgSlug, testId).then((res) => setTest(res.test));
  }, [orgSlug, testId]);

  if (!test) {
    return (
      <ScreenShell title="Loading…">
        <p className="text-sm text-slate-400">Loading test details…</p>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      title={test.name}
      footer={
        <Button
          loading={loading}
          onClick={async () => {
            await addItem("LAB_TEST", test.id);
            navigate(cartScreenFor(useWidgetStore.getState().cart?.cartType ?? null));
          }}
        >
          Add to Cart — ₹{test.price}
        </Button>
      }
    >
      <div className="space-y-4">
        {test.isPackage ? (
          <span className="inline-block rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
            Package
          </span>
        ) : null}
        <p className="text-sm text-slate-500">{test.category}</p>

        {test.includedParameters.length > 0 ? (
          <div>
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Includes
            </h2>
            <ul className="list-inside list-disc text-sm text-slate-700">
              {test.includedParameters.map((param) => (
                <li key={param}>{param}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {test.preparationInstructions ? (
          <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {test.preparationInstructions}
          </div>
        ) : null}

        <p className="text-sm text-slate-500">
          {test.homeCollectionEligible
            ? "Eligible for home sample collection."
            : "Centre visit required for this test."}
        </p>
      </div>
    </ScreenShell>
  );
}
