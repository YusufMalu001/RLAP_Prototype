"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "../../../../../components/Button";
import { LabTestForm } from "../../../../../components/LabTestForm";
import { api, ApiError } from "../../../../../lib/apiClient";
import type { LabOffering, LabTest } from "../../../../../lib/types";

export default function LabTestDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [test, setTest] = useState<LabTest | null>(null);
  const [offerings, setOfferings] = useState<LabOffering[]>([]);
  const [error, setError] = useState<string | null>(null);

  function reload() {
    api.labTest(params.id).then((data) => setTest(data.test));
    api.labOfferingsForTest(params.id).then((data) => setOfferings(data.offerings));
  }

  useEffect(reload, [params.id]);

  async function toggleOffered(o: LabOffering) {
    await api.setLabOffering({
      centreId: o.centreId,
      labTestId: o.labTestId,
      offered: !o.offered,
      priceOverride: o.priceOverride,
    });
    reload();
  }

  async function savePriceOverride(o: LabOffering, priceOverride: number | null) {
    await api.setLabOffering({
      centreId: o.centreId,
      labTestId: o.labTestId,
      offered: true,
      priceOverride,
    });
    reload();
  }

  async function handleDelete() {
    if (!test) return;
    if (!confirm(`Delete "${test.name}"? This cannot be undone.`)) return;
    try {
      await api.deleteLabTest(test.id);
      router.push("/catalogue/lab");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete");
    }
  }

  if (!test) return <p className="text-sm text-slate-400">Loading…</p>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">{test.name}</h1>
        <Button variant="danger" onClick={handleDelete}>
          Delete Test
        </Button>
      </div>
      {error ? (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      ) : null}

      <LabTestForm
        initial={test}
        submitLabel="Save Changes"
        onSubmit={async (values) => {
          await api.updateLabTest(test.id, values);
          reload();
        }}
      />

      <h2 className="mb-2 mt-8 text-sm font-semibold text-slate-700">
        Centre Availability & Pricing
      </h2>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-2">Centre</th>
              <th className="px-4 py-2">Offered</th>
              <th className="px-4 py-2">Base Price</th>
              <th className="px-4 py-2">Price Override</th>
            </tr>
          </thead>
          <tbody>
            {offerings.map((o) => (
              <OfferingRow
                key={o.centreId}
                label={o.centreName ?? o.centreId}
                offering={o}
                onToggle={() => toggleOffered(o)}
                onSavePrice={(price) => savePriceOverride(o, price)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OfferingRow({
  label,
  offering,
  onToggle,
  onSavePrice,
}: {
  label: string;
  offering: LabOffering;
  onToggle: () => void;
  onSavePrice: (price: number | null) => void;
}) {
  const [priceInput, setPriceInput] = useState(offering.priceOverride?.toString() ?? "");

  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="px-4 py-2">{label}</td>
      <td className="px-4 py-2">
        <input type="checkbox" checked={offering.offered} onChange={onToggle} />
      </td>
      <td className="px-4 py-2">₹{offering.basePrice}</td>
      <td className="px-4 py-2">
        {offering.offered ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="none"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-sm"
            />
            <button
              onClick={() => onSavePrice(priceInput === "" ? null : Number(priceInput))}
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              Save
            </button>
          </div>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </td>
    </tr>
  );
}
