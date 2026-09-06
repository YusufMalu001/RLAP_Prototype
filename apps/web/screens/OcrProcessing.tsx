"use client";

import { Breadcrumb } from "../components/AppHeader";

/** O2 — Processing State (transitional; no footer buttons). */
export function OcrProcessing() {
  return (
    <>
      <Breadcrumb section="Diagnostic Intake" step="Reading Prescription" />
      <div className="flex flex-col w-full items-center justify-center min-h-[50vh] relative px-margin-mobile">
        <div className="relative w-full max-w-[620px] bg-surface-container-lowest rounded-xl shadow-[0_8px_32px_rgba(22,59,72,0.06),0_24px_48px_rgba(22,59,72,0.04)] p-space-lg sm:p-space-2xl flex flex-col items-center text-center">
          <div className="w-full flex items-center justify-between pb-space-md mb-space-lg bg-surface-container-low/60 rounded-lg px-space-md py-space-xs">
            <div className="flex items-center gap-space-xs">
              <span className="w-2 h-2 rounded-full bg-secondary animate-ping" />
              <span className="font-caption text-caption text-primary-container tracking-wider uppercase">
                Secure Rx Scan
              </span>
            </div>
            <div className="flex items-center gap-space-2xs text-on-surface-variant font-caption text-caption">
              <span className="material-symbols-outlined text-[15px] text-primary">lock</span>
              <span>256-Bit Encrypted</span>
            </div>
          </div>

          <div className="relative w-24 h-24 mb-space-lg flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-primary-fixed/30 blur-md animate-pulse" />
            <div className="relative h-10 w-10 animate-spin rounded-full border-4 border-primary-container/30 border-t-primary" />
          </div>

          <h1 className="font-headline-md text-headline-md text-primary tracking-tight mb-space-xs">
            Reading your prescription…
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-[480px] leading-relaxed mb-space-xl">
            Our system is identifying recommended laboratory profiles and radiology examinations.
            This usually takes a few seconds.
          </p>

          <div className="w-full max-w-[480px] bg-surface-container-low/70 rounded-lg p-space-md text-left space-y-space-sm">
            <div className="flex items-center gap-space-sm">
              <span className="w-6 h-6 rounded-full bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm flex-shrink-0">
                <span className="material-symbols-outlined text-[16px] text-secondary">
                  check_circle
                </span>
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-label-md text-label-md text-on-surface truncate">
                  Image resolution &amp; legibility verified
                </p>
              </div>
              <span className="font-caption text-[12px] text-secondary font-medium">Passed</span>
            </div>
            <div className="flex items-center gap-space-sm">
              <span className="w-6 h-6 rounded-full bg-secondary-fixed/50 flex items-center justify-center text-secondary flex-shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-ping" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-label-md text-label-md text-primary font-semibold truncate">
                  Transcribing prescription details…
                </p>
              </div>
              <span className="font-caption text-[12px] text-secondary font-semibold animate-pulse">
                In Progress
              </span>
            </div>
            <div className="flex items-center gap-space-sm opacity-60">
              <span className="w-6 h-6 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant flex-shrink-0">
                <span className="material-symbols-outlined text-[16px] text-outline">
                  radio_button_unchecked
                </span>
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-label-md text-label-md text-on-surface truncate">
                  Matching against diagnostic formulary
                </p>
              </div>
              <span className="font-caption text-[12px] text-on-surface-variant">Pending</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
