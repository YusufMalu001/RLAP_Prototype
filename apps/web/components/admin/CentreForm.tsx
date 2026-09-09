"use client";

import { useState } from "react";
import type { Centre } from "@/lib/admin/types";
import { Button } from "./Button";
import { Checkbox, Field, TextInput } from "./Field";

export interface CentreFormValues {
  name: string;
  address: string;
  city: string;
  area: string;
  lat: number | null;
  lng: number | null;
  offersRadiology: boolean;
  offersLab: boolean;
}

export function CentreForm({
  initial,
  onSubmit,
  submitLabel,
}: {
  initial?: Partial<Centre>;
  onSubmit: (values: CentreFormValues) => Promise<void>;
  submitLabel: string;
}) {
  const [values, setValues] = useState<CentreFormValues>({
    name: initial?.name ?? "",
    address: initial?.address ?? "",
    city: initial?.city ?? "",
    area: initial?.area ?? "",
    lat: initial?.lat ?? null,
    lng: initial?.lng ?? null,
    offersRadiology: initial?.offersRadiology ?? false,
    offersLab: initial?.offersLab ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-3">
      {error ? (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      ) : null}

      <Field label="Name">
        <TextInput
          value={values.name}
          onChange={(e) => setValues({ ...values, name: e.target.value })}
          required
        />
      </Field>
      <Field label="Address">
        <TextInput
          value={values.address}
          onChange={(e) => setValues({ ...values, address: e.target.value })}
          required
        />
      </Field>
      <div className="flex gap-3">
        <div className="flex-1">
          <Field label="City">
            <TextInput
              value={values.city}
              onChange={(e) => setValues({ ...values, city: e.target.value })}
              required
            />
          </Field>
        </div>
        <div className="flex-1">
          <Field label="Area">
            <TextInput
              value={values.area}
              onChange={(e) => setValues({ ...values, area: e.target.value })}
              required
            />
          </Field>
        </div>
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <Field label="Latitude (optional)">
            <TextInput
              type="number"
              step="0.0001"
              value={values.lat ?? ""}
              onChange={(e) =>
                setValues({ ...values, lat: e.target.value === "" ? null : Number(e.target.value) })
              }
            />
          </Field>
        </div>
        <div className="flex-1">
          <Field label="Longitude (optional)">
            <TextInput
              type="number"
              step="0.0001"
              value={values.lng ?? ""}
              onChange={(e) =>
                setValues({ ...values, lng: e.target.value === "" ? null : Number(e.target.value) })
              }
            />
          </Field>
        </div>
      </div>

      <Checkbox
        label="Offers radiology"
        checked={values.offersRadiology}
        onChange={(e) => setValues({ ...values, offersRadiology: e.target.checked })}
      />
      <Checkbox
        label="Offers lab"
        checked={values.offersLab}
        onChange={(e) => setValues({ ...values, offersLab: e.target.checked })}
      />

      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
