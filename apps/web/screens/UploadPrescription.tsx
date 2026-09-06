"use client";

import { useRef } from "react";
import { Breadcrumb } from "../components/AppHeader";
import { useWidgetStore } from "../lib/store";

/** O1 — Upload Prescription. */
export function UploadPrescription() {
  const uploadPrescription = useWidgetStore((s) => s.uploadPrescription);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void uploadPrescription(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) void uploadPrescription(file);
  }

  return (
    <>
      <Breadcrumb section="Diagnostic Intake" step="Upload Prescription" />

      <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-space-xl">
        <div className="inline-flex items-center gap-space-xs bg-secondary-fixed text-on-secondary-fixed-variant px-space-md py-1 rounded-full mb-space-sm shadow-sm">
          <span className="material-symbols-outlined text-[16px]">psychology</span>
          <span className="font-caption text-caption font-semibold uppercase tracking-wider">
            Clinical OCR Diagnostics
          </span>
        </div>
        <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight mb-space-xs">
          Upload Doctor&apos;s Prescription
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
          Upload an image or scan of your prescription. We&apos;ll read it and add the right
          exams and tests for you automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        <div className="lg:col-span-8 flex flex-col gap-space-md">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="group relative bg-surface-container-lowest rounded-xl p-space-xl transition-all duration-300 shadow-[0_2px_4px_rgba(22,59,72,0.03),0_8px_24px_rgba(22,59,72,0.05)] hover:shadow-[0_6px_16px_rgba(22,59,72,0.06),0_16px_36px_rgba(22,59,72,0.08)] cursor-pointer overflow-hidden flex flex-col items-center justify-center text-center min-h-[360px]"
          >
            <div className="relative z-10 flex items-center justify-center mb-space-md">
              <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center text-primary-container shadow-inner transition-transform duration-300 group-hover:scale-105">
                <span className="material-symbols-outlined text-[40px]">description</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-secondary text-on-secondary flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-[16px]">add_a_photo</span>
              </div>
            </div>
            <div className="relative z-10 max-w-md flex flex-col items-center">
              <p className="font-title-md text-title-md text-primary font-semibold tracking-tight mb-1">
                Drag and drop your prescription here
              </p>
              <p className="font-body-md text-body-md text-on-surface-variant mb-space-lg">
                or browse securely from your computer or mobile device
              </p>
              <div className="flex flex-wrap items-center justify-center gap-space-sm w-full">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    cameraInputRef.current?.click();
                  }}
                  className="min-h-[52px] px-space-lg rounded-full bg-surface-container-high text-primary font-label-lg text-label-lg flex items-center justify-center gap-space-xs hover:bg-surface-container-highest transition-all duration-200 shadow-sm active:scale-95"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px] text-secondary">
                    photo_camera
                  </span>
                  <span>Take Photo</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="min-h-[52px] px-space-xl rounded-full bg-secondary text-on-secondary font-label-lg text-label-lg flex items-center justify-center gap-space-xs shadow-[0_4px_14px_rgba(154,68,45,0.28)] hover:opacity-95 transition-all duration-200 active:scale-95"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">cloud_upload</span>
                  <span>Choose File</span>
                </button>
              </div>
              <div className="mt-space-lg flex items-center gap-space-xs font-caption text-caption text-outline">
                <span className="material-symbols-outlined text-[16px] text-secondary">
                  verified
                </span>
                <span>Supports JPG, PNG, HEIC, and PDF up to 25MB</span>
              </div>
            </div>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFile}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFile}
              className="hidden"
            />
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-space-md">
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-[0_2px_4px_rgba(22,59,72,0.03),0_8px_24px_rgba(22,59,72,0.05)]">
            <div className="flex items-center justify-between mb-space-sm">
              <span className="font-label-md text-label-md text-primary font-semibold">
                Ideal Capture Guide
              </span>
            </div>
            <ul className="space-y-space-xs font-caption text-caption text-on-surface-variant">
              <li className="flex items-start gap-space-xs">
                <span className="material-symbols-outlined text-[16px] text-secondary flex-shrink-0 mt-0.5">
                  wb_sunny
                </span>
                <span>
                  Ensure adequate, natural lighting without harsh shadows or camera flash
                  reflections.
                </span>
              </li>
              <li className="flex items-start gap-space-xs">
                <span className="material-symbols-outlined text-[16px] text-secondary flex-shrink-0 mt-0.5">
                  crop_free
                </span>
                <span>Lay the document completely flat; capture all four paper borders.</span>
              </li>
              <li className="flex items-start gap-space-xs">
                <span className="material-symbols-outlined text-[16px] text-secondary flex-shrink-0 mt-0.5">
                  verified_user
                </span>
                <span>
                  Verify that the physician&apos;s signature, date, and tests remain legible.
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-surface-container-low rounded-xl p-space-md flex items-center justify-between text-on-surface-variant">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-[20px] text-primary">edit_note</span>
              <span className="font-caption text-caption font-medium">
                Have a handwritten note?
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full bg-surface-container-lowest rounded-xl p-space-md shadow-[0_2px_4px_rgba(22,59,72,0.03)] flex flex-col sm:flex-row items-center justify-between gap-space-md mt-space-lg">
        <div className="flex items-center gap-space-sm text-left">
          <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary flex-shrink-0">
            <span className="material-symbols-outlined text-[22px]">lock</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-space-xs font-label-md text-label-md text-primary font-semibold">
              <span>HIPAA &amp; GDPR Compliant Infrastructure</span>
              <span className="material-symbols-outlined text-[16px] text-secondary">
                verified
              </span>
            </div>
            <p className="font-caption text-caption text-on-surface-variant">
              Medical-grade 256-bit encryption. Your prescriptions are reviewed strictly by
              licensed staff.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
