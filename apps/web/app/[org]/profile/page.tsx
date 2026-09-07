"use client";

import { useState } from "react";
import { AppShell, Breadcrumb } from "../../../components/AppHeader";
import { api, ApiError } from "../../../lib/apiClient";
import type {
  AlcoholConsumption,
  MedicalHistoryInput,
  PatientProfile,
  SmokingStatus,
} from "../../../lib/types";

const SMOKING_OPTIONS: { value: SmokingStatus; label: string }[] = [
  { value: "NEVER", label: "Never smoked" },
  { value: "FORMER", label: "Former smoker" },
  { value: "CURRENT", label: "Current smoker" },
];

const ALCOHOL_OPTIONS: { value: AlcoholConsumption; label: string }[] = [
  { value: "NONE", label: "None" },
  { value: "OCCASIONAL", label: "Occasional" },
  { value: "REGULAR", label: "Regular" },
];

/** Standalone, OTP-gated Patient Profile — identity + self-reported medical history (to sharpen
 * future recommendations) + a read-only history of completed reports. Never required to book. */
export default function ProfilePage({ params }: { params: { org: string } }) {
  const orgSlug = params.org;
  const [step, setStep] = useState<"MOBILE" | "OTP" | "PROFILE">("MOBILE");
  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState<MedicalHistoryInput>({});

  async function sendOtp() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.reportsSendOtp(orgSlug, mobile);
      setDevOtp(res.devOtp ?? null);
      setStep("OTP");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send OTP");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setLoading(true);
    setError(null);
    try {
      const verify = await api.reportsVerifyOtp(orgSlug, mobile, code);
      const data = await api.patientProfile(verify.sessionToken);
      setSessionToken(verify.sessionToken);
      setProfile(data);
      setForm({
        heightCm: data.patient.heightCm,
        weightKg: data.patient.weightKg,
        allergies: data.patient.allergies,
        chronicConditions: data.patient.chronicConditions,
        currentMedications: data.patient.currentMedications,
        familyMedicalHistory: data.patient.familyMedicalHistory,
        smokingStatus: data.patient.smokingStatus,
        alcoholConsumption: data.patient.alcoholConsumption,
        medicalNotes: data.patient.medicalNotes,
      });
      setStep("PROFILE");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Incorrect OTP — please try again");
    } finally {
      setLoading(false);
    }
  }

  async function saveMedicalHistory() {
    if (!sessionToken) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await api.saveMedicalHistory(sessionToken, form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save your details");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <Breadcrumb section="My Account" step="Patient Profile" backHref={`/${orgSlug}/book`} />

      {error ? (
        <div className="mb-space-md rounded-lg border border-error bg-error-container px-space-md py-space-sm font-body-md text-body-md text-on-error-container">
          {error}
        </div>
      ) : null}

      {step === "MOBILE" ? (
        <div className="mx-auto flex w-full max-w-[560px] flex-col gap-space-lg rounded-xl bg-surface-container-lowest p-card-pad-lg shadow-sm">
          <div className="flex flex-col items-center gap-space-xs text-center">
            <div className="mb-space-xs flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-[26px]">person</span>
            </div>
            <h1 className="font-headline-md text-headline-md text-primary">Your Patient Profile</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Verify your mobile number to view your reports and update your medical history.
            </p>
          </div>
          <div className="flex flex-col gap-space-xs">
            <label className="font-label-md font-semibold text-primary">Mobile Number</label>
            <div className="flex h-touch-target-min items-center gap-space-xs rounded-lg bg-surface-container-low px-space-md focus-within:bg-surface-container">
              <span className="font-body-lg text-body-lg text-on-surface-variant">+91</span>
              <input
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="10-digit mobile number"
                inputMode="numeric"
                className="flex-1 bg-transparent font-body-lg text-body-lg text-on-surface outline-none placeholder:text-outline"
              />
            </div>
          </div>
          <button
            disabled={mobile.length !== 10 || loading}
            onClick={() => void sendOtp()}
            className="flex h-12 items-center justify-center gap-space-xs rounded-lg bg-secondary font-label-lg text-label-lg text-on-secondary shadow-sm transition-all hover:bg-secondary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Sending…" : "Send OTP"}
          </button>
        </div>
      ) : null}

      {step === "OTP" ? (
        <div className="mx-auto flex w-full max-w-[560px] flex-col gap-space-lg rounded-xl bg-surface-container-lowest p-card-pad-lg shadow-sm">
          <div className="flex flex-col items-center gap-space-xs text-center">
            <h1 className="font-headline-md text-headline-md text-primary">Enter the OTP</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Sent a 6-digit code to +91 {mobile}
            </p>
          </div>
          {devOtp ? (
            <p className="rounded-lg bg-surface-container-low px-space-md py-space-sm text-center font-caption text-caption text-on-surface-variant">
              Dev mode — your code is{" "}
              <span className="font-mono font-semibold text-on-surface">{devOtp}</span>
            </p>
          ) : null}
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="6-digit OTP"
            inputMode="numeric"
            className="h-touch-target-min w-full rounded-lg bg-surface-container-low px-space-md text-center font-body-lg text-body-lg text-on-surface outline-none focus:bg-surface-container"
          />
          <button
            disabled={code.length !== 6 || loading}
            onClick={() => void verifyOtp()}
            className="flex h-12 items-center justify-center gap-space-xs rounded-lg bg-secondary font-label-lg text-label-lg text-on-secondary shadow-sm transition-all hover:bg-secondary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Verifying…" : "Verify"}
          </button>
        </div>
      ) : null}

      {step === "PROFILE" && profile ? (
        <div className="grid w-full grid-cols-1 items-start gap-gutter-desktop pb-16 lg:grid-cols-12">
          {/* Left column: identity + medical history form */}
          <div className="flex flex-col gap-space-lg lg:col-span-8">
            <section className="rounded-xl bg-surface-container-lowest p-card-pad-lg shadow-sm">
              <div className="flex items-center gap-space-md">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary">
                  <span className="font-headline-sm text-headline-sm font-bold">
                    {(profile.patient.name ?? "?").trim().charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1 className="font-headline-md text-headline-md text-primary">
                    {profile.patient.name ?? "Patient"}
                  </h1>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    +91 {profile.patient.mobileNumber}
                    {profile.patient.dobOrAge ? ` · ${profile.patient.dobOrAge}` : ""}
                    {profile.patient.gender ? ` · ${profile.patient.gender}` : ""}
                  </p>
                </div>
              </div>
            </section>

            <section className="flex flex-col gap-space-lg rounded-xl bg-surface-container-lowest p-card-pad-lg shadow-sm">
              <div className="flex flex-col gap-1">
                <h2 className="font-title-md text-title-md font-semibold text-primary">
                  Medical History
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Optional — helps our clinical team tailor test recommendations and safety checks
                  to you. Never required to book.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-space-md sm:grid-cols-4">
                <div className="flex flex-col gap-1">
                  <label className="font-label-md font-semibold text-primary">Height (cm)</label>
                  <input
                    type="number"
                    value={form.heightCm ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        heightCm: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    className="h-11 w-full rounded-lg bg-surface-container-low px-space-sm font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-label-md font-semibold text-primary">Weight (kg)</label>
                  <input
                    type="number"
                    value={form.weightKg ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        weightKg: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    className="h-11 w-full rounded-lg bg-surface-container-low px-space-sm font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container"
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-1 sm:col-span-2">
                  <label className="font-label-md font-semibold text-primary">Smoking</label>
                  <select
                    value={form.smokingStatus ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        smokingStatus: (e.target.value || null) as SmokingStatus | null,
                      }))
                    }
                    className="h-11 w-full rounded-lg bg-surface-container-low px-space-sm font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container"
                  >
                    <option value="">Not specified</option>
                    {SMOKING_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-label-md font-semibold text-primary">
                  Alcohol Consumption
                </label>
                <div className="flex flex-wrap gap-space-xs">
                  {ALCOHOL_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => setForm((f) => ({ ...f, alcoholConsumption: o.value }))}
                      className={`rounded-full px-space-md py-space-xs font-label-md text-label-md transition-colors ${
                        form.alcoholConsumption === o.value
                          ? "bg-primary-container text-on-primary"
                          : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label className="font-label-md font-semibold text-primary">
                    Known Allergies
                  </label>
                  <textarea
                    value={form.allergies ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, allergies: e.target.value }))}
                    placeholder="e.g. Penicillin, contrast dye, latex"
                    rows={2}
                    className="w-full rounded-lg bg-surface-container-low px-space-sm py-space-xs font-body-md text-body-md text-on-surface outline-none placeholder:text-outline focus:bg-surface-container"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-label-md font-semibold text-primary">
                    Chronic Conditions
                  </label>
                  <textarea
                    value={form.chronicConditions ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, chronicConditions: e.target.value }))}
                    placeholder="e.g. Diabetes, hypertension, asthma"
                    rows={2}
                    className="w-full rounded-lg bg-surface-container-low px-space-sm py-space-xs font-body-md text-body-md text-on-surface outline-none placeholder:text-outline focus:bg-surface-container"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-label-md font-semibold text-primary">
                    Current Medications
                  </label>
                  <textarea
                    value={form.currentMedications ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, currentMedications: e.target.value }))}
                    placeholder="Name, dosage, frequency"
                    rows={2}
                    className="w-full rounded-lg bg-surface-container-low px-space-sm py-space-xs font-body-md text-body-md text-on-surface outline-none placeholder:text-outline focus:bg-surface-container"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-label-md font-semibold text-primary">
                    Family Medical History
                  </label>
                  <textarea
                    value={form.familyMedicalHistory ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, familyMedicalHistory: e.target.value }))
                    }
                    placeholder="e.g. Heart disease, cancer, diabetes in immediate family"
                    rows={2}
                    className="w-full rounded-lg bg-surface-container-low px-space-sm py-space-xs font-body-md text-body-md text-on-surface outline-none placeholder:text-outline focus:bg-surface-container"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-label-md font-semibold text-primary">
                  Additional Notes
                </label>
                <textarea
                  value={form.medicalNotes ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, medicalNotes: e.target.value }))}
                  placeholder="Anything else our clinical team should know"
                  rows={2}
                  className="w-full rounded-lg bg-surface-container-low px-space-sm py-space-xs font-body-md text-body-md text-on-surface outline-none placeholder:text-outline focus:bg-surface-container"
                />
              </div>

              <div className="flex items-center gap-space-md pt-space-xs">
                <button
                  disabled={saving}
                  onClick={() => void saveMedicalHistory()}
                  className="flex h-11 items-center justify-center gap-space-xs rounded-lg bg-secondary px-space-lg font-label-lg text-label-lg text-on-secondary shadow-sm transition-all hover:bg-secondary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  {saving ? "Saving…" : "Save Medical History"}
                </button>
                {saved ? (
                  <span className="flex items-center gap-1 font-label-md text-label-md text-success">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    Saved
                  </span>
                ) : null}
              </div>
            </section>
          </div>

          {/* Right column: previous reports */}
          <div className="flex flex-col gap-space-md lg:col-span-4">
            <div className="rounded-xl bg-surface-container-lowest p-card-pad-md shadow-sm">
              <h2 className="mb-space-md font-title-md text-title-md font-semibold text-primary">
                Previous Reports
              </h2>
              {profile.reports.length === 0 ? (
                <p className="font-body-md text-body-md text-on-surface-variant">
                  No completed reports yet.
                </p>
              ) : (
                <div className="flex flex-col gap-space-sm">
                  {profile.reports.map((booking) => (
                    <div
                      key={booking.id}
                      className="rounded-lg bg-surface-container-low p-space-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-label-lg text-label-lg font-semibold text-primary">
                          {booking.bookingCode}
                        </span>
                        <span className="font-caption text-caption text-on-surface-variant">
                          {new Date(booking.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="font-caption text-caption text-on-surface-variant">
                        {booking.centre.name}
                      </p>
                      <p className="mt-1 font-body-md text-body-md text-on-surface">
                        {booking.items.join(", ")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
