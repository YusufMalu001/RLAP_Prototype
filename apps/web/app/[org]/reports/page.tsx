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
    <main className="mx-auto min-h-screen w-full max-w-md bg-white px-4 py-8">
      <h1 className="mb-1 text-lg font-semibold text-slate-900">Download Reports</h1>
      <p className="mb-6 text-sm text-slate-500">
        Verify your mobile number to see your completed reports.
      </p>

      {error ? (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      ) : null}

      {step === "MOBILE" ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 focus-within:border-blue-500">
            <span className="text-sm text-slate-500">+91</span>
            <input
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="10-digit mobile number"
              className="flex-1 text-sm outline-none"
            />
          </div>
          <Button disabled={mobile.length !== 10} loading={loading} onClick={() => void sendOtp()}>
            Send OTP
          </Button>
        </div>
      ) : null}

      {step === "OTP" ? (
        <div className="space-y-3">
          {devOtp ? (
            <p className="rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-500">
              Dev mode — your code is <span className="font-mono font-semibold">{devOtp}</span>
            </p>
          ) : null}
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="6-digit OTP"
            inputMode="numeric"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
          />
          <Button disabled={code.length !== 6} loading={loading} onClick={() => void verifyOtp()}>
            Verify
          </Button>
        </div>
      ) : null}

      {step === "LIST" ? (
        <div className="space-y-3">
          {bookings.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No completed reports yet.</p>
          ) : (
            bookings.map((booking) => (
              <div key={booking.id} className="rounded-xl border border-slate-200 p-4">
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">{booking.bookingCode}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(booking.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-xs text-slate-500">{booking.centre.name}</p>
                <p className="mt-1 text-sm text-slate-700">{booking.items.join(", ")}</p>
                <button className="mt-2 text-xs font-semibold text-blue-600 underline" disabled>
                  Download Report (PDF)
                </button>
              </div>
            ))
          )}
        </div>
      ) : null}
    </main>
  );
}
