"use client";

import { useState } from "react";
import { Button } from "../components/Button";
import { ScreenShell } from "../components/ScreenShell";
import { useWidgetStore } from "../lib/store";
import type { SafetyCheckAnswers } from "../lib/types";

const QUESTIONS: Array<{ key: keyof SafetyCheckAnswers; label: string }> = [
  { key: "PREGNANCY", label: "Are you currently pregnant or possibly pregnant?" },
  { key: "PACEMAKER", label: "Do you have a pacemaker or any implanted electronic device?" },
  { key: "IMPLANTS", label: "Do you have any metallic implants (plates, screws, clips)?" },
  { key: "ALLERGIES", label: "Do you have any known allergies to contrast dye or medications?" },
];

/** R7 / C3 — Safety & Eligibility Check, triggered only when an MRI/contrast exam is in the cart. */
export function SafetyCheck() {
  const submitSafetyCheck = useWidgetStore((s) => s.submitSafetyCheck);
  const loading = useWidgetStore((s) => s.loading);
  const [answers, setAnswers] = useState<Partial<SafetyCheckAnswers>>({});

  const allAnswered = QUESTIONS.every((q) => answers[q.key] !== undefined);

  return (
    <ScreenShell
      title="A few safety questions"
      footer={
        <Button
          disabled={!allAnswered}
          loading={loading}
          onClick={() => void submitSafetyCheck(answers as SafetyCheckAnswers)}
        >
          Continue
        </Button>
      }
    >
      <p className="mb-4 text-sm text-slate-500">
        Your scan requires an MRI or contrast agent — please answer honestly for your own safety.
      </p>
      <div className="space-y-4">
        {QUESTIONS.map((q) => (
          <div key={q.key}>
            <p className="mb-2 text-sm font-medium text-slate-800">{q.label}</p>
            <div className="flex gap-2">
              {[
                { label: "No", value: false },
                { label: "Yes", value: true },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setAnswers((a) => ({ ...a, [q.key]: opt.value }))}
                  className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold ${
                    answers[q.key] === opt.value
                      ? opt.value
                        ? "border-red-400 bg-red-50 text-red-700"
                        : "border-emerald-400 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScreenShell>
  );
}
