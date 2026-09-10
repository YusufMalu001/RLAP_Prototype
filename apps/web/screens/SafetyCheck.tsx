"use client";

import { useState } from "react";
import { Breadcrumb } from "../components/AppHeader";
import { usePrimaryAction } from "../components/PrimaryAction";
import { useWidgetStore } from "../lib/store";
import type { SafetyCheckAnswers } from "../lib/types";

const QUESTIONS: Array<{
  key: keyof SafetyCheckAnswers;
  title: string;
  helper: string;
  noLabel: string;
  yesLabel: string;
}> = [
  {
    key: "PACEMAKER",
    title: "Do you have a cardiac pacemaker, defibrillator, or metallic neurostimulator?",
    helper: "Active electrical implants require specific magnetic resonance adjustments.",
    noLabel: "No, None Present",
    yesLabel: "Yes, Device Present",
  },
  {
    key: "PREGNANCY",
    title: "Is there any possibility of current pregnancy?",
    helper: "Our clinicians apply gentle fetal protective guidelines where applicable.",
    noLabel: "No / Not Applicable",
    yesLabel: "Yes, Confirmed or Possible",
  },
  {
    key: "ALLERGIES",
    title: "Have you ever had an adverse allergic reaction to contrast dye or medications?",
    helper: "Helps us prepare appropriate formulations or pre-medications for comfort.",
    noLabel: "No Known Allergies",
    yesLabel: "Yes, Previous Reaction",
  },
  {
    key: "IMPLANTS",
    title: "Do you have any implanted orthopedic pins, plates, or metallic clips?",
    helper: "Logging exact anatomy helps our technologists optimize image clarity.",
    noLabel: "No Implants",
    yesLabel: "Yes, Titanium / Surgical Implants",
  },
];

/** R7 / C3 — Safety & Eligibility Check, triggered only when an MRI/contrast exam is in the cart. */
export function SafetyCheck() {
  const submitSafetyCheck = useWidgetStore((s) => s.submitSafetyCheck);
  const loading = useWidgetStore((s) => s.loading);
  const [answers, setAnswers] = useState<Partial<SafetyCheckAnswers>>({});

  const allAnswered = QUESTIONS.every((q) => answers[q.key] !== undefined);

  usePrimaryAction({
    label: "Save & Continue to Instructions",
    onClick: () => void submitSafetyCheck(answers as SafetyCheckAnswers),
    disabled: !allAnswered || loading,
    loading,
  });

  return (
    <>
      <Breadcrumb section="Booking" step="Safety & Eligibility" sessionLabel="Step 3 of 4" />

      <div className="grid grid-cols-1 items-start gap-gutter-desktop lg:grid-cols-12">
        <div className="flex flex-col gap-space-lg lg:col-span-8">
          <header className="flex flex-col gap-space-xs">
            <div className="inline-flex items-center gap-2 self-start rounded-full bg-primary-fixed px-space-sm py-1 font-caption text-caption font-semibold text-primary">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              RLAP Precision Care Assurance
            </div>
            <h1 className="font-headline-lg text-headline-lg font-bold tracking-tight text-primary">
              Pre-Scan Safety &amp; Eligibility Screening
            </h1>
            <p className="max-w-2xl font-body-lg text-body-lg text-on-surface-variant">
              This helps us keep your scan safe and tailor protocols to your clinical health.
            </p>
          </header>

          <div className="flex flex-col gap-space-xl rounded-xl bg-surface-container-lowest p-space-lg shadow-sm md:p-space-xl">
            {QUESTIONS.map((q, idx) => (
              <div key={q.key}>
                {idx > 0 ? <div className="mb-space-xl h-px w-full bg-surface-container-high" /> : null}
                <div className="flex flex-col gap-space-md">
                  <div className="flex items-start gap-space-sm">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-container-low font-label-lg text-label-lg text-primary">
                      {idx + 1}
                    </span>
                    <div>
                      <h3 className="font-title-md text-title-md font-semibold text-on-surface">
                        {q.title}
                      </h3>
                      <p className="mt-1 font-caption text-caption text-outline">{q.helper}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-space-sm pl-0 sm:grid-cols-2 sm:pl-9">
                    <button
                      onClick={() => setAnswers((a) => ({ ...a, [q.key]: false }))}
                      className={`flex min-h-[52px] items-center justify-between rounded-full px-space-md py-space-sm text-left transition-all ${
                        answers[q.key] === false
                          ? "bg-primary text-on-primary shadow-sm"
                          : "bg-surface-container-low text-on-surface hover:bg-surface-container-high"
                      }`}
                      type="button"
                    >
                      <div className="flex items-center gap-space-xs">
                        {answers[q.key] === false ? (
                          <span
                            className="material-symbols-outlined text-[20px] text-primary-fixed"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            check_circle
                          </span>
                        ) : (
                          <span className="h-5 w-5 rounded-full bg-surface-container-highest" />
                        )}
                        <span className="font-label-lg text-label-lg font-medium">{q.noLabel}</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setAnswers((a) => ({ ...a, [q.key]: true }))}
                      className={`flex min-h-[52px] items-center justify-between rounded-full px-space-md py-space-sm text-left transition-all ${
                        answers[q.key] === true
                          ? "bg-primary text-on-primary shadow-sm"
                          : "bg-surface-container-low text-on-surface hover:bg-surface-container-high"
                      }`}
                      type="button"
                    >
                      <div className="flex items-center gap-space-xs">
                        {answers[q.key] === true ? (
                          <span
                            className="material-symbols-outlined text-[20px] text-primary-fixed"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            check_circle
                          </span>
                        ) : (
                          <span className="h-5 w-5 rounded-full bg-surface-container-highest" />
                        )}
                        <span className="font-label-lg text-label-lg font-medium">
                          {q.yesLabel}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>

        <div className="flex flex-col gap-space-lg lg:col-span-4">
          <div className="flex flex-col gap-space-md rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-[20px] text-secondary">
                shield_with_heart
              </span>
              <span className="font-label-lg text-label-lg font-semibold text-primary">
                Your Safety Protocol
              </span>
            </div>
            <p className="font-caption text-caption leading-relaxed text-on-surface-variant">
              Every RLAP scan follows dual-level radiologist validation. If your answers indicate
              specialized needs, our technologists prepare dedicated sequences before you arrive.
            </p>
            <div className="flex items-center justify-between rounded-lg bg-surface-container-low p-space-sm">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="font-caption text-caption font-semibold text-on-surface">
                  Protocol Status
                </span>
              </div>
              <span className="font-caption text-caption font-bold text-primary">
                {allAnswered ? "Ready to Finalize" : "Awaiting Answers"}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-space-md rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
            <div className="flex items-center gap-space-xs text-primary">
              <span className="material-symbols-outlined text-[20px]">contact_support</span>
              <h4 className="font-label-lg text-label-lg font-semibold">
                Need Clinician Assistance?
              </h4>
            </div>
            <p className="font-caption text-caption text-on-surface-variant">
              Questions about safety? Speak with our on-duty MR Safety Officer:
            </p>
            <a
              className="group flex items-center justify-between rounded-lg bg-surface-container-low p-space-sm transition-colors hover:bg-surface-container"
              href="tel:+18004927527"
            >
              <div className="flex items-center gap-space-xs">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-container text-on-primary">
                  <span className="material-symbols-outlined text-[16px]">call</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-caption text-caption text-[11px] leading-tight text-outline">
                    MR Safety Desk
                  </span>
                  <span className="font-label-md text-label-md font-semibold text-primary transition-colors group-hover:text-secondary">
                    +1 (800) 492-RLAP
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-[18px] text-outline transition-transform group-hover:translate-x-0.5">
                chevron_right
              </span>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
