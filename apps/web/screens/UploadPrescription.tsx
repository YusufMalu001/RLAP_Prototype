"use client";

import { useRef } from "react";
import { ScreenShell } from "../components/ScreenShell";
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

  return (
    <ScreenShell title="Upload Prescription">
      <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-slate-200 px-6 py-10 text-center">
        <span className="mb-3 text-3xl">📄</span>
        <p className="mb-1 text-sm font-semibold text-slate-800">
          Take a photo or upload your prescription
        </p>
        <p className="mb-6 text-xs text-slate-500">
          We&apos;ll read it and add the right exams and tests for you.
        </p>

        <div className="w-full space-y-2">
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Take Photo
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Choose File
          </button>
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
    </ScreenShell>
  );
}
