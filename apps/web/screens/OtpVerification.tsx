"use client";

import { useEffect, useRef, useState } from "react";
import { Breadcrumb } from "../components/AppHeader";
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
  const minutes = Math.floor(cooldown / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (cooldown % 60).toString().padStart(2, "0");

  if (!mobile) {
    return (
      <>
        <Breadcrumb section="Checkout" step="Mobile Number" sessionLabel="RLAP Concierge Gateway" />
        <div className="mx-auto flex w-full max-w-[640px] flex-col gap-space-lg">
          <div className="relative flex flex-col gap-space-lg overflow-hidden rounded-xl bg-surface-container-lowest p-card-pad-md shadow-rlap-1 lg:p-card-pad-lg">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary-fixed/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-secondary-fixed/30 blur-3xl" />

            <div className="relative z-10 flex flex-col items-center gap-space-xs text-center">
              <div className="mb-space-xs flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-low text-primary-container shadow-sm">
                <span className="material-symbols-outlined text-[26px]">smartphone</span>
              </div>
              <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                Secure Checkout
              </span>
              <h1 className="font-headline-md text-headline-md tracking-tight text-primary">
                Verify your mobile number
              </h1>
              <p className="font-body-md max-w-[480px] text-body-md text-on-surface-variant">
                We&rsquo;ll send a 6-digit security code by SMS to confirm this booking belongs to you.
              </p>
            </div>

            <div className="relative z-10 flex flex-col gap-space-xs">
              <label className="font-label-lg text-label-lg text-primary">Mobile Number</label>
              <div className="flex h-touch-target-min items-center gap-space-xs rounded-lg bg-surface-container-low px-space-md shadow-[0_2px_4px_rgba(22,59,72,0.02)] transition-all focus-within:bg-surface-container-lowest">
                <span className="font-body-lg text-body-lg text-on-surface-variant">+91</span>
                <input
                  value={mobileInput}
                  onChange={(e) => setMobileInput(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="10-digit mobile number"
                  inputMode="numeric"
                  className="font-body-lg flex-1 bg-transparent text-body-lg text-on-surface outline-none placeholder:text-outline"
                />
              </div>
            </div>

            <button
              disabled={mobileInput.length !== 10 || loading}
              onClick={() => void handleSend()}
              className="flex min-h-[52px] w-full items-center justify-center gap-space-xs rounded-xl bg-secondary px-space-lg py-space-sm font-label-lg text-label-lg text-on-secondary shadow-[0_4px_14px_rgba(154,68,45,0.25)] transition-all hover:bg-on-secondary-container active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>Send OTP</span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>

            <div className="relative z-10 flex flex-col items-center gap-space-xs pt-space-md sm:flex-row sm:justify-center sm:gap-space-xs sm:border-t sm:border-surface-container-high sm:pt-space-md">
              <span className="material-symbols-outlined text-[18px] text-primary-container">
                enhanced_encryption
              </span>
              <span className="font-caption text-center text-caption text-on-surface-variant">
                Encrypted 256-bit SMS Gateway — RLAP staff will never ask for your private verification code.
              </span>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Breadcrumb section="Checkout" step="Verify OTP" sessionLabel="RLAP Concierge Gateway" />
      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-space-lg">
        <div className="relative flex flex-col gap-space-lg overflow-hidden rounded-xl bg-surface-container-lowest p-card-pad-md shadow-rlap-1 lg:p-card-pad-lg">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary-fixed/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-secondary-fixed/30 blur-3xl" />

          <div className="relative z-10 flex flex-col items-center gap-space-xs text-center">
            <div className="mb-space-xs flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-low text-primary-container shadow-sm">
              <span className="material-symbols-outlined text-[26px]">key</span>
            </div>
            <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
              Enter 6-Digit Security Code
            </span>
            <h1 className="font-headline-md text-headline-md tracking-tight text-primary">
              Verify your phone number
            </h1>
            <p className="font-body-md max-w-[480px] text-body-md text-on-surface-variant">
              A 6-digit code has been dispatched via secure SMS to{" "}
              <span className="font-semibold text-primary">+91 {mobile}</span>. Enter it below to confirm your
              reservation.
            </p>
          </div>

          {devOtp ? (
            <p className="relative z-10 rounded-lg border border-outline-variant bg-surface-container px-space-md py-space-sm text-center font-caption text-caption text-on-surface-variant">
              Dev mode — your code is <span className="font-mono font-semibold text-on-surface">{devOtp}</span>
            </p>
          ) : null}

          <div className="relative z-10 flex flex-col items-center gap-space-md">
            <div className="flex w-full items-center justify-center gap-2 sm:gap-space-sm">
              {otpBoxes.map((digit, i) => (
                <div
                  key={i}
                  className="flex h-14 w-12 flex-col items-center justify-center rounded-xl bg-surface-container-low shadow-sm transition-all focus-within:bg-surface-container-lowest sm:h-16 sm:w-14"
                >
                  <input
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
                    aria-label={`Digit ${i + 1}`}
                    className="font-headline-md h-full w-full bg-transparent text-center text-headline-md text-primary outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 flex flex-col items-center gap-space-sm pt-space-xs">
            <div className="flex items-center gap-space-xs font-label-md text-label-md">
              <span className="text-on-surface-variant">Didn&rsquo;t receive the SMS?</span>
              {cooldown > 0 ? (
                <span className="inline-flex items-center gap-1 font-semibold text-outline">
                  <span className="material-symbols-outlined text-[16px]">history</span>
                  Resend OTP in {minutes}:{seconds}
                </span>
              ) : (
                <button
                  onClick={() => void handleSend()}
                  className="inline-flex items-center gap-1 font-semibold text-secondary hover:underline"
                >
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                  Resend Code Now
                </button>
              )}
            </div>
          </div>

          <div className="relative z-10 flex flex-col gap-space-xs pt-space-xs">
            <button
              disabled={code.length !== 6 || loading}
              onClick={() => void verifyOtp(code)}
              className="flex min-h-[52px] w-full items-center justify-center gap-space-xs rounded-xl bg-secondary px-space-lg py-space-sm font-label-lg text-label-lg text-on-secondary shadow-[0_4px_14px_rgba(224,122,95,0.28)] transition-all hover:bg-on-secondary-container active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>Verify &amp; Proceed</span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          </div>

          <div className="relative z-10 flex flex-col items-center gap-space-xs pt-space-xs text-center sm:flex-row sm:justify-center">
            <span className="material-symbols-outlined text-[18px] text-primary-container">
              enhanced_encryption
            </span>
            <span className="font-caption text-caption text-on-surface-variant">
              Encrypted 256-bit SMS Gateway — RLAP staff will never ask for your private verification code.
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
