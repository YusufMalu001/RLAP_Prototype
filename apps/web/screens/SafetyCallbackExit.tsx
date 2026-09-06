"use client";

import { Breadcrumb } from "../components/AppHeader";
import { useWidgetStore } from "../lib/store";

/**
 * Dead-end reached when a safety-check answer is flagged (§4.2 R7/C3). Deliberately does not
 * offer a "Continue" — online confirmation is blocked; the patient is routed to a callback.
 */
export function SafetyCallbackExit() {
  const reset = useWidgetStore((s) => s.reset);

  return (
    <>
      <Breadcrumb section="Preparation" step="Safety Review" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop items-start">
        <div className="lg:col-span-8 flex flex-col gap-space-lg">
          <header className="flex flex-col gap-space-xs">
            <div className="inline-flex items-center gap-2 self-start bg-tertiary-fixed text-on-tertiary-fixed-variant px-space-sm py-1 rounded-full font-caption text-caption font-semibold">
              <span className="material-symbols-outlined text-[16px]">health_and_safety</span>
              RLAP Precision Care Assurance
            </div>
            <h1 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">
              Let&apos;s talk it through
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
              For your safety, this booking needs a quick check with our clinical team before it
              can be confirmed online.
            </p>
          </header>

          <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg md:p-space-xl flex flex-col gap-space-lg">
            <div className="p-space-md rounded-xl bg-tertiary-fixed/30 flex items-start gap-space-sm">
              <span className="material-symbols-outlined text-on-tertiary-fixed-variant text-[24px] mt-0.5">
                emergency
              </span>
              <div className="flex flex-col gap-space-2xs">
                <span className="font-title-md text-title-md text-on-surface font-semibold">
                  One of our answers needs a clinician&apos;s review
                </span>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  One of our staff will call you shortly to confirm the details and complete your
                  booking safely — there&apos;s nothing more to fill in right now.
                </p>
              </div>
            </div>

            <div className="h-px w-full bg-surface-container-high" />

            <div className="flex items-start gap-space-sm">
              <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5">
                call
              </span>
              <div className="flex flex-col">
                <span className="font-label-md text-label-md font-semibold text-on-surface">
                  What happens next
                </span>
                <span className="font-caption text-caption text-on-surface-variant">
                  A member of our clinical team will reach out on your registered number, review
                  your answers, and finalize the safest protocol for your visit before confirming
                  your appointment.
                </span>
              </div>
            </div>

            <button
              onClick={() => reset()}
              className="w-full sm:w-auto self-start px-space-xl py-space-sm rounded-full border-2 border-outline-variant text-on-surface font-label-lg text-label-lg transition-colors hover:bg-surface-container min-h-[52px]"
              type="button"
            >
              Start a New Booking
            </button>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-space-lg">
          <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-md">
            <div className="flex items-center gap-space-xs text-primary">
              <span className="material-symbols-outlined text-[20px]">contact_support</span>
              <h4 className="font-label-lg text-label-lg font-semibold">Need immediate help?</h4>
            </div>
            <p className="font-caption text-caption text-on-surface-variant">
              Speak with our on-duty safety desk directly:
            </p>
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
                    Safety Desk
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
            <div className="flex items-center gap-space-xs text-outline font-caption text-caption text-[11px] pt-1">
              <span className="material-symbols-outlined text-[14px]">lock</span>
              <span>Confidential HIPAA-compliant clinical assessment</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
