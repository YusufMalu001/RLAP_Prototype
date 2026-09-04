"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "../../../../components/Button";
import { CentreForm } from "../../../../components/CentreForm";
import { TextInput } from "../../../../components/Field";
import { api, ApiError } from "../../../../lib/apiClient";
import type {
  Centre,
  LabOffering,
  RadiologyOffering,
  ServiceableArea,
} from "../../../../lib/types";

export default function CentreDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [centre, setCentre] = useState<Centre | null>(null);
  const [areas, setAreas] = useState<ServiceableArea[]>([]);
  const [radiologyOfferings, setRadiologyOfferings] = useState<RadiologyOffering[]>([]);
  const [labOfferings, setLabOfferings] = useState<LabOffering[]>([]);
  const [error, setError] = useState<string | null>(null);

  function reload() {
    api.centre(params.id).then((data) => setCentre(data.centre));
    api.serviceableAreas(params.id).then((data) => setAreas(data.areas));
    api
      .radiologyOfferingsForCentre(params.id)
      .then((data) => setRadiologyOfferings(data.offerings));
    api.labOfferingsForCentre(params.id).then((data) => setLabOfferings(data.offerings));
  }

  useEffect(reload, [params.id]);

  async function handleDelete() {
    if (!centre) return;
    if (!confirm(`Delete "${centre.name}"? This cannot be undone.`)) return;
    try {
      await api.deleteCentre(centre.id);
      router.push("/centres");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete");
    }
  }

  if (!centre) return <p className="text-sm text-slate-400">Loading…</p>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">{centre.name}</h1>
        <div className="flex gap-2">
          <Link href={`/centres/${centre.id}/slots`}>
            <Button variant="secondary">Manage Slots</Button>
          </Link>
          <Button variant="danger" onClick={handleDelete}>
            Delete Centre
          </Button>
        </div>
      </div>
      {error ? (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      ) : null}

      <CentreForm
        initial={centre}
        submitLabel="Save Changes"
        onSubmit={async (values) => {
          await api.updateCentre(centre.id, values);
          reload();
        }}
      />

      <ServiceableAreasSection centreId={centre.id} areas={areas} onChange={reload} />

      {centre.offersRadiology ? (
        <OfferingsSection
          title="Radiology Exams Offered"
          rows={radiologyOfferings.map((o) => ({
            key: o.radiologyExamId,
            label: o.radiologyExamName ?? o.radiologyExamId,
            offering: o,
          }))}
          onToggle={(o) =>
            api
              .setRadiologyOffering({
                centreId: centre.id,
                radiologyExamId: o.radiologyExamId,
                offered: !o.offered,
                priceOverride: o.priceOverride,
              })
              .then(reload)
          }
          onSavePrice={(o, price) =>
            api
              .setRadiologyOffering({
                centreId: centre.id,
                radiologyExamId: o.radiologyExamId,
                offered: true,
                priceOverride: price,
              })
              .then(reload)
          }
        />
      ) : null}

      {centre.offersLab ? (
        <OfferingsSection
          title="Lab Tests Offered"
          rows={labOfferings.map((o) => ({
            key: o.labTestId,
            label: o.labTestName ?? o.labTestId,
            offering: o,
          }))}
          onToggle={(o) =>
            api
              .setLabOffering({
                centreId: centre.id,
                labTestId: o.labTestId,
                offered: !o.offered,
                priceOverride: o.priceOverride,
              })
              .then(reload)
          }
          onSavePrice={(o, price) =>
            api
              .setLabOffering({
                centreId: centre.id,
                labTestId: o.labTestId,
                offered: true,
                priceOverride: price,
              })
              .then(reload)
          }
        />
      ) : null}
    </div>
  );
}

function ServiceableAreasSection({
  centreId,
  areas,
  onChange,
}: {
  centreId: string;
  areas: ServiceableArea[];
  onChange: () => void;
}) {
  const [pinCode, setPinCode] = useState("");
  const [charge, setCharge] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.createServiceableArea(centreId, {
        pinCode,
        homeCollectionCharge: Number(charge),
      });
      setPinCode("");
      setCharge("");
      onChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add PIN code");
    }
  }

  return (
    <div className="mt-8">
      <h2 className="mb-2 text-sm font-semibold text-slate-700">
        Serviceable PIN Codes (Home Collection)
      </h2>
      {error ? (
        <div className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      ) : null}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-2">PIN Code</th>
              <th className="px-4 py-2">Collection Charge</th>
              <th className="px-4 py-2">Active</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {areas.map((area) => (
              <tr key={area.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2">{area.pinCode}</td>
                <td className="px-4 py-2">₹{area.homeCollectionCharge}</td>
                <td className="px-4 py-2">
                  <input
                    type="checkbox"
                    checked={area.isActive}
                    onChange={() =>
                      api
                        .updateServiceableArea(area.id, { isActive: !area.isActive })
                        .then(onChange)
                    }
                  />
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => api.deleteServiceableArea(area.id).then(onChange)}
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            <tr>
              <td className="px-4 py-2">
                <TextInput
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  placeholder="500016"
                  maxLength={6}
                />
              </td>
              <td className="px-4 py-2">
                <TextInput
                  type="number"
                  value={charge}
                  onChange={(e) => setCharge(e.target.value)}
                  placeholder="150"
                />
              </td>
              <td className="px-4 py-2" colSpan={2}>
                <Button variant="secondary" onClick={handleAdd}>
                  + Add PIN
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OfferingsSection<
  T extends { offered: boolean; priceOverride: number | null; basePrice: number },
>({
  title,
  rows,
  onToggle,
  onSavePrice,
}: {
  title: string;
  rows: Array<{ key: string; label: string; offering: T }>;
  onToggle: (o: T) => void;
  onSavePrice: (o: T, price: number | null) => void;
}) {
  return (
    <div className="mt-8">
      <h2 className="mb-2 text-sm font-semibold text-slate-700">{title}</h2>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-2">Item</th>
              <th className="px-4 py-2">Offered</th>
              <th className="px-4 py-2">Base Price</th>
              <th className="px-4 py-2">Price Override</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <PriceOverrideRow
                key={row.key}
                label={row.label}
                offering={row.offering}
                onToggle={() => onToggle(row.offering)}
                onSavePrice={(price) => onSavePrice(row.offering, price)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PriceOverrideRow<
  T extends { offered: boolean; priceOverride: number | null; basePrice: number },
>({
  label,
  offering,
  onToggle,
  onSavePrice,
}: {
  label: string;
  offering: T;
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
