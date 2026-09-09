"use client";

import { useState } from "react";
import type { LabTest } from "@/lib/admin/types";
import { Button } from "./Button";
import { Checkbox, Field, TextArea, TextInput } from "./Field";

export interface LabTestFormValues {
  name: string;
  category: string;
  isPackage: boolean;
  includedParameters: string[];
  preparationInstructions: string;
  price: number;
  homeCollectionEligible: boolean;
  payAtReceptionEligible: boolean;
}

export function LabTestForm({
  initial,
  onSubmit,
  submitLabel,
}: {
  initial?: Partial<LabTest>;
  onSubmit: (values: LabTestFormValues) => Promise<void>;
  submitLabel: string;
}) {
  const [values, setValues] = useState<LabTestFormValues>({
    name: initial?.name ?? "",
    category: initial?.category ?? "",
    isPackage: initial?.isPackage ?? false,
    includedParameters: initial?.includedParameters ?? [],
    preparationInstructions: initial?.preparationInstructions ?? "",
    price: initial?.price ?? 0,
    homeCollectionEligible: initial?.homeCollectionEligible ?? false,
    payAtReceptionEligible: initial?.payAtReceptionEligible ?? true,
  });
  const [includedParametersInput, setIncludedParametersInput] = useState(
    (initial?.includedParameters ?? []).join(", "),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        ...values,
        includedParameters: includedParametersInput
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean),
      });
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
          <Field label="Category">
            <TextInput
              value={values.category}
              onChange={(e) => setValues({ ...values, category: e.target.value })}
              required
            />
          </Field>
        </div>
        <div className="flex-1">
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
        </div>
      </div>

      <Field label="Preparation Instructions">
        <TextArea
          value={values.preparationInstructions}
          onChange={(e) => setValues({ ...values, preparationInstructions: e.target.value })}
          rows={3}
        />
      </Field>

      <Checkbox
        label="Is a package (bundle of multiple parameters)"
        checked={values.isPackage}
        onChange={(e) => setValues({ ...values, isPackage: e.target.checked })}
      />

      {values.isPackage ? (
        <Field label="Included Parameters (comma-separated)">
          <TextInput
            value={includedParametersInput}
            onChange={(e) => setIncludedParametersInput(e.target.value)}
            placeholder="CBC, Blood Sugar Fasting, Lipid Profile"
          />
        </Field>
      ) : null}

      <Checkbox
        label="Eligible for home sample collection"
        checked={values.homeCollectionEligible}
        onChange={(e) => setValues({ ...values, homeCollectionEligible: e.target.checked })}
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
