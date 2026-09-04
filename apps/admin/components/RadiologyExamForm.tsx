"use client";

import { useState } from "react";
import { Button } from "./Button";
import { Checkbox, Field, Select, TextArea, TextInput } from "./Field";
import type { BodyPartCategory, Modality, RadiologyExam } from "../lib/types";

const MODALITIES: Modality[] = ["ULTRASOUND", "XRAY", "CT", "MRI", "ECG"];
const BODY_PART_CATEGORIES: BodyPartCategory[] = [
  "HEAD_NECK",
  "CHEST_CARDIAC",
  "ABDOMEN_PELVIS",
  "SPINE",
  "UPPER_LIMB",
  "LOWER_LIMB",
  "WHOLE_BODY",
];

export interface RadiologyExamFormValues {
  name: string;
  modality: Modality;
  bodyPartCategory: BodyPartCategory;
  requiresSafetyCheck: boolean;
  preparationInstructions: string;
  price: number;
  payAtReceptionEligible: boolean;
}

export function RadiologyExamForm({
  initial,
  onSubmit,
  submitLabel,
}: {
  initial?: Partial<RadiologyExam>;
  onSubmit: (values: RadiologyExamFormValues) => Promise<void>;
  submitLabel: string;
}) {
  const [values, setValues] = useState<RadiologyExamFormValues>({
    name: initial?.name ?? "",
    modality: initial?.modality ?? "ULTRASOUND",
    bodyPartCategory: initial?.bodyPartCategory ?? "ABDOMEN_PELVIS",
    requiresSafetyCheck: initial?.requiresSafetyCheck ?? false,
    preparationInstructions: initial?.preparationInstructions ?? "",
    price: initial?.price ?? 0,
    payAtReceptionEligible: initial?.payAtReceptionEligible ?? true,
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

      <div className="flex gap-3">
        <div className="flex-1">
          <Field label="Modality">
            <Select
              value={values.modality}
              onChange={(e) => setValues({ ...values, modality: e.target.value as Modality })}
            >
              {MODALITIES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="flex-1">
          <Field label="Body Part Category">
            <Select
              value={values.bodyPartCategory}
              onChange={(e) =>
                setValues({ ...values, bodyPartCategory: e.target.value as BodyPartCategory })
              }
            >
              {BODY_PART_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </div>

      <Field label="Price (₹)">
        <TextInput
          type="number"
          min={0}
          step="0.01"
          value={values.price}
          onChange={(e) => setValues({ ...values, price: Number(e.target.value) })}
          required
        />
      </Field>

      <Field label="Preparation Instructions">
        <TextArea
          value={values.preparationInstructions}
          onChange={(e) => setValues({ ...values, preparationInstructions: e.target.value })}
          rows={3}
        />
      </Field>

      <Checkbox
        label="Requires safety/eligibility check (MRI, contrast studies)"
        checked={values.requiresSafetyCheck}
        onChange={(e) => setValues({ ...values, requiresSafetyCheck: e.target.checked })}
      />
      <Checkbox
        label="Eligible for Pay at Reception"
        checked={values.payAtReceptionEligible}
        onChange={(e) => setValues({ ...values, payAtReceptionEligible: e.target.checked })}
      />

      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
