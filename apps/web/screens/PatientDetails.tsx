"use client";

import { useEffect, useState } from "react";
import { Button } from "../components/Button";
import { ScreenShell } from "../components/ScreenShell";
import { useWidgetStore } from "../lib/store";
import type { Gender } from "../lib/types";

const GENDERS: Gender[] = ["MALE", "FEMALE", "OTHER"];

/** SC5 — Patient Details, pre-filled and editable on a match, blank otherwise. Strictly one patient. */
export function PatientDetails() {
  const isExistingPatient = useWidgetStore((s) => s.isExistingPatient);
  const prefillPatient = useWidgetStore((s) => s.prefillPatient);
  const savePatientDetails = useWidgetStore((s) => s.savePatientDetails);
  const loading = useWidgetStore((s) => s.loading);

  const [name, setName] = useState("");
  const [dobOrAge, setDobOrAge] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [email, setEmail] = useState("");
  const [editingFresh, setEditingFresh] = useState(false);

  const prefilled = isExistingPatient && !editingFresh;

  useEffect(() => {
    if (isExistingPatient && prefillPatient && !editingFresh) {
      setName(prefillPatient.name ?? "");
      setDobOrAge(prefillPatient.dobOrAge ?? "");
      setGender(prefillPatient.gender ?? null);
      setEmail(prefillPatient.email ?? "");
    }
  }, [isExistingPatient, prefillPatient, editingFresh]);

  const canContinue = name.trim() && dobOrAge.trim() && gender;

  return (
    <ScreenShell
      title="Patient Details"
      footer={
        <Button
          disabled={!canContinue}
          loading={loading}
          onClick={() =>
            void savePatientDetails({
              name: name.trim(),
              dobOrAge: dobOrAge.trim(),
              gender: gender!,
              email: email.trim() || undefined,
            })
          }
        >
          Continue
        </Button>
      }
    >
      {prefilled ? (
        <button
          onClick={() => {
            setEditingFresh(true);
            setName("");
            setDobOrAge("");
            setGender(null);
            setEmail("");
          }}
          className="mb-4 text-xs font-medium text-blue-600 underline"
        >
          Not you? Enter new details
        </button>
      ) : null}

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Full Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Date of Birth or Age
          </label>
          <input
            value={dobOrAge}
            onChange={(e) => setDobOrAge(e.target.value)}
            placeholder="e.g. 1990-05-12 or 34"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Gender</label>
          <div className="flex gap-2">
            {GENDERS.map((g) => (
              <button
                key={g}
                onClick={() => setGender(g)}
                className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold ${
                  gender === g
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-200 text-slate-600"
                }`}
              >
                {g.charAt(0) + g.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Email (optional)</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
          />
        </div>
      </div>
    </ScreenShell>
  );
}
