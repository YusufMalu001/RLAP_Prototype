"use client";

import { Breadcrumb } from "../components/AppHeader";
import { useWidgetStore } from "../lib/store";

/** O4 — OCR Failure Fallback, on total OCR failure only (low-confidence is handled inline in the cart). */
export function OcrFailure() {
  const navigate = useWidgetStore((s) => s.navigate);

  return (
    <>
      <Breadcrumb section="Diagnostic Intake" step="Upload Couldn't Be Read" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop items-start">
        <div className="lg:col-span-8 flex flex-col gap-space-lg">
          <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg md:p-space-xl flex flex-col gap-space-lg">
            <div className="flex items-start gap-space-sm">
              <div className="w-12 h-12 rounded-full bg-tertiary-fixed flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-on-tertiary-fixed-variant text-[26px]">
                  quiz
                </span>
              </div>
              <div className="flex flex-col gap-space-xs">
                <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
                  We couldn&apos;t quite read that prescription
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  No problem — you can search for your exams and tests manually, or try
                  uploading a clearer photo.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-space-sm">
              <button
                onClick={() => navigate("HOME")}
                className="flex-1 min-h-[52px] px-space-lg rounded-full bg-secondary text-on-secondary font-label-lg text-label-lg flex items-center justify-center gap-space-xs shadow-sm hover:opacity-95 transition-all"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">search</span>
                <span>Search Manually</span>
              </button>
              <button
                onClick={() => navigate("UPLOAD_PRESCRIPTION")}
                className="flex-1 min-h-[52px] px-space-lg rounded-full border-2 border-outline-variant text-on-surface font-label-lg text-label-lg flex items-center justify-center gap-space-xs hover:bg-surface-container transition-all"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                <span>Try Uploading Again</span>
              </button>
            </div>
          </div>

          <div className="bg-primary-container rounded-xl p-space-lg text-on-primary flex flex-col sm:flex-row items-start sm:items-center gap-space-md shadow-md">
            <div className="w-12 h-12 rounded-full bg-surface-container-lowest/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">support_agent</span>
            </div>
            <div className="flex-1">
              <p className="font-label-lg text-label-lg font-semibold">
                Prefer a helping hand?
              </p>
              <p className="font-caption text-caption text-surface-dim">
                Our concierge desk can take your prescription details over a quick call and add
                the right exams and tests for you.
              </p>
            </div>
            <a
              href="tel:+18004927527"
              className="shrink-0 inline-flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-surface-container-lowest text-primary font-label-md text-label-md font-semibold whitespace-nowrap"
            >
              <span>Call Concierge</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </a>
          </div>
        </div>

        <aside className="lg:col-span-4 flex flex-col gap-space-lg">
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
            <div className="flex items-center gap-space-xs text-primary">
              <span className="material-symbols-outlined text-[20px]">tips_and_updates</span>
              <h4 className="font-label-lg text-label-lg font-semibold">
                Tips for a clean capture
              </h4>
            </div>
            <ul className="space-y-space-xs font-caption text-caption text-on-surface-variant">
              <li className="flex items-start gap-space-xs">
                <span className="material-symbols-outlined text-[16px] text-secondary flex-shrink-0 mt-0.5">
                  wb_sunny
                </span>
                <span>Use natural light and avoid harsh shadows or flash glare.</span>
              </li>
              <li className="flex items-start gap-space-xs">
                <span className="material-symbols-outlined text-[16px] text-secondary flex-shrink-0 mt-0.5">
                  crop_free
                </span>
                <span>Lay the prescription flat and capture all four borders.</span>
              </li>
              <li className="flex items-start gap-space-xs">
                <span className="material-symbols-outlined text-[16px] text-secondary flex-shrink-0 mt-0.5">
                  verified_user
                </span>
                <span>Make sure the doctor&apos;s signature and test names are legible.</span>
              </li>
            </ul>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-sm">
            <h4 className="font-label-lg text-label-lg font-semibold text-primary">
              Need Clinician Assistance?
            </h4>
            <a
              className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors group"
              href="tel:+18004927527"
            >
              <div className="flex items-center gap-space-xs">
                <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px]">call</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-caption text-caption text-outline text-[11px] leading-tight">
                    Concierge Desk
                  </span>
                  <span className="font-label-md text-label-md font-semibold text-primary group-hover:text-secondary transition-colors">
                    +1 (800) 492-RLAP
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-outline group-hover:translate-x-0.5 transition-transform text-[18px]">
                chevron_right
              </span>
            </a>
          </div>

          <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col gap-space-xs">
            <span className="font-label-md text-label-md font-semibold text-on-surface">
              Quick Directory
            </span>
            <div className="flex flex-wrap gap-space-xs">
              {["Radiology", "Lab Tests", "Health Packages", "Home Collection"].map((label) => (
                <span
                  key={label}
                  className="px-space-sm py-space-2xs rounded-full bg-surface-container-lowest text-on-surface-variant font-caption text-caption"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
