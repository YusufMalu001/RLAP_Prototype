"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "../components/Button";
import { ScreenShell } from "../components/ScreenShell";
import { useWidgetStore } from "../lib/store";

/** SC4 — Mobile Number & OTP Verification, shared across all booking flows. */
export function OtpVerification() {
  const sendOtp = useWidgetStore((s) => s.sendOtp);
  const verifyOtp = useWidgetStore((s) => s.verifyOtp);
  const mobile = useWidgetStore((s) => s.mobile);
  const devOtp = useWidgetStore((s) => s.devOtp);
  const resendAvailableInSeconds = useWidgetStore((s) => s.resendAvailableInSeconds);
  const loading = useWidgetStore((s) => s.loading);

  const [mobileInput, setMobileInput] = useState("");
  const [otpBoxes, setOtpBoxes] = useState(["", "", "", "", "", ""]);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function handleSend() {
    await sendOtp(mobileInput);
    setCooldown(resendAvailableInSeconds);
  }

  function handleDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otpBoxes];
    next[index] = digit;
    setOtpBoxes(next);
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
  }

  const code = otpBoxes.join("");

  if (!mobile) {
    return (
      <ScreenShell
        title="Verify your mobile number"
        footer={
          <Button
            disabled={mobileInput.length !== 10}
            loading={loading}
            onClick={() => void handleSend()}
          >
            Send OTP
          </Button>
        }
      >
        <label className="mb-1 block text-xs font-medium text-slate-500">Mobile Number</label>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 focus-within:border-blue-500">
          <span className="text-sm text-slate-500">+91</span>
          <input
            value={mobileInput}
            onChange={(e) => setMobileInput(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="10-digit mobile number"
            className="flex-1 text-sm outline-none"
          />
        </div>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      title="Enter the OTP"
      footer={
        <div className="space-y-2">
          <Button
            disabled={code.length !== 6}
            loading={loading}
            onClick={() => void verifyOtp(code)}
          >
            Verify & Continue
          </Button>
          <button
            disabled={cooldown > 0}
            onClick={() => void handleSend()}
            className="w-full text-center text-xs font-medium text-blue-600 disabled:text-slate-400"
          >
            {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
          </button>
        </div>
      }
    >
      <p className="mb-4 text-sm text-slate-500">Sent a 6-digit code to +91 {mobile}</p>
      {devOtp ? (
        <p className="mb-4 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-500">
          Dev mode — your code is <span className="font-mono font-semibold">{devOtp}</span>
        </p>
      ) : null}
      <div className="flex justify-between gap-2">
        {otpBoxes.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            value={digit}
            onChange={(e) => handleDigit(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !digit && i > 0) inputRefs.current[i - 1]?.focus();
            }}
            inputMode="numeric"
            maxLength={1}
            className="h-12 w-11 rounded-xl border border-slate-200 text-center text-lg font-semibold outline-none focus:border-blue-500"
          />
        ))}
      </div>
    </ScreenShell>
  );
}
