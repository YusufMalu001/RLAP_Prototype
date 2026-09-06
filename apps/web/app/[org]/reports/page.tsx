"use client";

import { useState } from "react";
import { Button } from "../../../components/Button";
import { api, ApiError } from "../../../lib/apiClient";
import type { ReportBooking } from "../../../lib/types";

/** RPT — Report Download, a standalone entry point outside the main widget flow (§4.3). */
export default function ReportsPage({ params }: { params: { org: string } }) {
  const orgSlug = params.org;
  const [step, setStep] = useState<"MOBILE" | "OTP" | "LIST">("MOBILE");
  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [bookings, setBookings] = useState<ReportBooking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      const { bookings: results } = await api.reports(orgSlug, verify.sessionToken);
      setBookings(results);
      setStep("LIST");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Incorrect OTP — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-rlap-surface px-4 py-8">
      <h1 className="mb-1 text-headline-md font-bold text-rlap-on-surface">📄 Download Reports</h1>
      <p className="mb-6 text-body-md text-rlap-on-surface-variant">
        Verify your mobile number to see your completed reports.
      </p>

      {error ? (
        <div className="mb-4 rounded-lg border border-rlap-error bg-rlap-error/5 px-4 py-3 text-body-md text-rlap-error">
          {error}
        </div>
      ) : null}

      {step === "MOBILE" ? (
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-label-md font-semibold text-rlap-on-surface">
              Mobile Number
            </label>
            <div className="flex items-center gap-2 rounded-lg border-2 border-rlap-outline-variant bg-rlap-surface-bright px-4 py-3 focus-within:border-rlap-primary">
              <span className="text-body-md text-rlap-on-surface-variant">+91</span>
              <input
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="10-digit mobile number"
                className="flex-1 bg-transparent text-body-md text-rlap-on-surface outline-none placeholder:text-rlap-on-surface-variant"
              />
            </div>
          </div>
          <Button disabled={mobile.length !== 10} loading={loading} onClick={() => void sendOtp()}>
            Send OTP
          </Button>
        </div>
      ) : null}

      {step === "OTP" ? (
        <div className="space-y-4">
          {devOtp ? (
            <p className="rounded-lg border border-rlap-outline-variant bg-rlap-surface-container px-4 py-3 text-label-md text-rlap-on-surface-variant">
              Dev mode — your code is{" "}
              <span className="font-mono font-semibold text-rlap-on-surface">{devOtp}</span>
            </p>
          ) : null}
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="6-digit OTP"
            inputMode="numeric"
            className="w-full rounded-lg border-2 border-rlap-outline-variant bg-rlap-surface-bright px-4 py-3 text-body-md text-rlap-on-surface outline-none placeholder:text-rlap-on-surface-variant focus:border-rlap-primary"
          />
          <Button disabled={code.length !== 6} loading={loading} onClick={() => void verifyOtp()}>
            Verify
          </Button>
        </div>
      ) : null}

      {step === "LIST" ? (
        <div className="space-y-3">
          {bookings.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <span className="mb-3 text-3xl">📭</span>
              <p className="text-body-md text-rlap-on-surface-variant">No completed reports yet.</p>
            </div>
          ) : (
            bookings.map((booking) => (
              <div
                key={booking.id}
                className="rounded-lg border border-rlap-outline-variant bg-rlap-surface-bright p-4 shadow-rlap-1"
              >
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-title-md font-semibold text-rlap-on-surface">
                    {booking.bookingCode}
                  </p>
                  <p className="text-caption text-rlap-on-surface-variant">
                    {new Date(booking.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-label-md text-rlap-on-surface-variant">{booking.centre.name}</p>
                <p className="mt-1 text-body-md text-rlap-on-surface">{booking.items.join(", ")}</p>
                <button
                  className="mt-3 text-label-md font-semibold text-rlap-primary-container underline disabled:text-rlap-on-surface-variant"
                  disabled
                >
                  ⬇ Download Report (PDF)
                </button>
              </div>
            ))
          )}
        </div>
      ) : null}
    </main>
  );
}
