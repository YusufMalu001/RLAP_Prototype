"use client";

import { useEffect, useState } from "react";
import { Breadcrumb } from "../components/AppHeader";
import { usePrimaryAction } from "../components/PrimaryAction";
import { useWidgetStore } from "../lib/store";
import type { Gender } from "../lib/types";

const GENDERS: { value: Gender; label: string }[] = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other / Non-Binary" },
];

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

  const canContinue = Boolean(name.trim() && dobOrAge.trim() && gender);

  function handleContinue() {
    void savePatientDetails({
      name: name.trim(),
      dobOrAge: dobOrAge.trim(),
      gender: gender!,
      email: email.trim() || undefined,
    });
  }

  function toggleFresh() {
    setEditingFresh(true);
    setName("");
    setDobOrAge("");
    setGender(null);
    setEmail("");
  }

  usePrimaryAction({
    label: "Continue to Booking Summary",
    onClick: handleContinue,
    disabled: !canContinue || loading,
  });

  const initials = name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      <Breadcrumb section="Checkout" step="Patient Details" sessionLabel="Patient Demographic Information" />
      <div className="grid w-full grid-cols-1 items-start gap-space-xl lg:grid-cols-12">
        {/* Left column: form */}
        <div className="flex flex-col gap-space-lg lg:col-span-8">
          {prefilled ? (
            <div className="relative flex flex-col justify-between gap-space-sm overflow-hidden rounded-xl bg-primary-container p-card-pad-md text-on-primary shadow-rlap-1 sm:flex-row sm:items-center">
              <div className="flex items-start gap-space-sm">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-on-primary/10">
                  <span className="material-symbols-outlined text-[20px] text-primary-fixed">badge</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-lg text-label-lg font-semibold tracking-tight">
                    Verified Patient Matched
                  </span>
                  <p className="font-body-md text-body-md leading-snug text-primary-fixed-dim">
                    {prefillPatient?.name ?? "Returning patient"}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleFresh}
                className="self-start rounded-full bg-surface-container-lowest/15 px-space-sm py-space-xs font-label-md text-label-md text-on-primary transition-all hover:bg-surface-container-lowest/25 sm:self-center"
              >
                Not you? Enter new details
              </button>
            </div>
          ) : null}

          <div className="flex flex-col gap-space-lg rounded-xl bg-surface-container-lowest p-card-pad-lg shadow-sm">
            <div className="flex flex-col gap-space-2xs pb-space-xs">
              <h1 className="font-headline-md text-headline-md tracking-tight text-primary">
                Who is this booking for?
              </h1>
              <p className="font-body-md max-w-2xl text-body-md leading-relaxed text-on-surface-variant">
                Diagnostic reports and encrypted records will be registered under this identity.
              </p>
            </div>

            <div className="flex flex-col gap-space-lg">
              <div className="flex flex-col gap-space-2xs">
                <label className="font-label-lg text-label-lg text-primary">Full Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter patient full name"
                  className="font-body-lg h-touch-target-min w-full rounded-lg bg-surface-container-low px-space-md text-body-lg text-on-surface shadow-[0_2px_4px_rgba(22,59,72,0.02)] outline-none transition-all focus:bg-surface-container-lowest"
                />
              </div>

              <div className="grid grid-cols-1 items-start gap-space-md sm:grid-cols-12">
                <div className="flex flex-col gap-space-2xs sm:col-span-12">
                  <label className="font-label-lg text-label-lg text-primary">Date of Birth or Age</label>
                  <input
                    value={dobOrAge}
                    onChange={(e) => setDobOrAge(e.target.value)}
                    placeholder="e.g. 1990-05-12 or 34"
                    className="font-body-lg h-touch-target-min w-full rounded-lg bg-surface-container-low px-space-md text-body-lg text-on-surface shadow-[0_2px_4px_rgba(22,59,72,0.02)] outline-none transition-all focus:bg-surface-container-lowest"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-space-xs">
                <label className="font-label-lg text-label-lg text-primary">Gender</label>
                <div
                  role="radiogroup"
                  aria-label="Gender Selection"
                  className="grid grid-cols-2 gap-space-xs rounded-xl bg-surface-container-low p-1 sm:grid-cols-3"
                >
                  {GENDERS.map((g) => (
                    <button
                      key={g.value}
                      onClick={() => setGender(g.value)}
                      className={`flex h-12 items-center justify-center rounded-lg font-label-md text-label-md transition-all ${
                        gender === g.value
                          ? "bg-primary-container font-semibold text-on-primary shadow-sm"
                          : "text-on-surface-variant hover:bg-surface-container-lowest hover:text-on-surface"
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-space-2xs">
                <div className="flex flex-wrap items-center justify-between gap-space-2xs">
                  <label className="font-label-lg text-label-lg text-primary">Email</label>
                  <span className="inline-flex items-center rounded-full bg-surface-container px-space-xs py-0.5 font-caption text-caption text-on-surface-variant">
                    Optional — for PDF reports
                  </span>
                </div>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="patient.name@provider.com"
                  className="font-body-lg h-touch-target-min w-full rounded-lg bg-surface-container-low px-space-md text-body-lg text-on-surface shadow-[0_2px_4px_rgba(22,59,72,0.02)] outline-none transition-all focus:bg-surface-container-lowest"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-space-md rounded-xl bg-surface-container-lowest p-card-pad-md shadow-sm sm:flex-row lg:hidden">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-[20px] text-secondary">lock</span>
              <span className="font-caption text-caption text-on-surface-variant">Encrypted patient record</span>
            </div>
          </div>
        </div>

        {/* Right column: itinerary summary */}
        <div className="flex flex-col gap-space-md lg:sticky lg:top-20 lg:col-span-4">
          <div className="flex flex-col gap-space-md rounded-xl bg-surface-container-lowest p-card-pad-md shadow-sm">
            <div className="flex items-center justify-between pb-space-2xs">
              <span className="font-label-lg text-label-lg font-bold text-primary">Reserved Session</span>
              <span className="material-symbols-outlined text-[20px] text-primary">event_available</span>
            </div>

            {initials ? (
              <div className="flex items-center gap-space-sm rounded-xl bg-surface-container-low p-space-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary font-label-md text-label-md text-on-primary">
                  {initials}
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-label-md text-label-md text-primary">{name}</span>
                  <span className="truncate font-caption text-caption text-on-surface-variant">
                    {dobOrAge || "—"} {gender ? `· ${gender.charAt(0)}${gender.slice(1).toLowerCase()}` : ""}
                  </span>
                </div>
              </div>
            ) : null}

            <p className="hidden text-center font-caption text-[11px] text-outline lg:block">
              Pay online or choose Private Reception Desk on arrival
            </p>
          </div>

          <div className="rounded-xl bg-amber-500/10 p-card-pad-md">
            <div className="flex items-start gap-space-sm">
              <span className="material-symbols-outlined mt-0.5 shrink-0 text-[22px] text-amber-700">lock</span>
              <div className="flex flex-col gap-space-2xs">
                <span className="font-label-md text-label-md font-bold text-amber-900">HIPAA &amp; NABH Encrypted</span>
                <p className="font-caption text-caption leading-normal text-amber-900/90">
                  Your patient record and diagnostic reports are securely encrypted end to end.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
