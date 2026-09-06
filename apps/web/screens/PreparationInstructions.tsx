"use client";

import { Breadcrumb } from "../components/AppHeader";
import { useWidgetStore } from "../lib/store";

/** R8 / L6 / C4 — Preparation Instructions, shown after centre selection, before slot selection. */
export function PreparationInstructions() {
  const preparation = useWidgetStore((s) => s.preparation);
  const navigate = useWidgetStore((s) => s.navigate);

  const hasRadiology = (preparation?.radiology.length ?? 0) > 0;
  const hasLab = (preparation?.lab.length ?? 0) > 0;
  const isCombined = hasRadiology && hasLab;

  return (
    <>
      <Breadcrumb
        section="Preparation Guidelines"
        step={isCombined ? "Combined Prep" : "Before you arrive"}
      />

      <section className="flex flex-col gap-space-sm pb-space-lg">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md">
          <div className="space-y-space-xs max-w-2xl">
            <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
              {isCombined ? "Combined Appointment Preparation" : "Before you arrive"}
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {isCombined
                ? "Review the protocol for each service below. Because you are visiting for both imaging and bloodwork, follow the synchronized instructions for a smooth appointment."
                : "Following these guidelines ensures optimal accuracy for your diagnostic results."}
            </p>
          </div>
          {isCombined ? (
            <div className="inline-flex items-center gap-space-xs self-start lg:self-center px-space-md py-space-xs rounded-full bg-secondary-fixed text-on-secondary-fixed shadow-sm">
              <span className="material-symbols-outlined text-[18px]">sync</span>
              <span className="font-label-md text-label-md font-semibold">
                Synchronized Protocol
              </span>
            </div>
          ) : null}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop items-start">
        <div className="lg:col-span-8 flex flex-col gap-space-lg">
          {hasRadiology ? (
            <article className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
              <div className="flex items-center gap-space-sm pb-space-xs">
                <div className="w-12 h-12 rounded-lg bg-primary-fixed flex items-center justify-center text-on-primary-fixed shadow-sm">
                  <span className="material-symbols-outlined text-[26px]">radiology</span>
                </div>
                <div>
                  <span className="font-caption text-caption text-on-surface-variant uppercase tracking-wider font-semibold">
                    Imaging
                  </span>
                  <h2 className="font-headline-sm text-headline-sm text-primary">
                    For your Scan
                  </h2>
                </div>
              </div>
              <div className="flex flex-col gap-space-sm">
                {preparation!.radiology.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-space-sm p-space-sm rounded-lg bg-surface-container-low"
                  >
                    <div className="mt-space-2xs w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary-container text-[20px]">
                        water_drop
                      </span>
                    </div>
                    <div className="flex flex-col gap-space-2xs">
                      <h3 className="font-label-lg text-label-lg text-primary">{entry.name}</h3>
                      <p className="font-body-md text-body-md text-on-surface-variant">
                        {entry.preparationInstructions ?? "No special preparation required."}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ) : null}

          {hasLab ? (
            <article className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
              <div className="flex items-center gap-space-sm pb-space-xs">
                <div className="w-12 h-12 rounded-lg bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed shadow-sm">
                  <span className="material-symbols-outlined text-[26px]">bloodtype</span>
                </div>
                <div>
                  <span className="font-caption text-caption text-on-surface-variant uppercase tracking-wider font-semibold">
                    Lab Test
                  </span>
                  <h2 className="font-headline-sm text-headline-sm text-primary">
                    For your Lab Test
                  </h2>
                </div>
              </div>
              <div className="flex flex-col gap-space-sm">
                {preparation!.lab.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-space-sm p-space-sm rounded-lg bg-surface-container-low"
                  >
                    <div className="mt-space-2xs w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-secondary text-[20px]">
                        no_meals
                      </span>
                    </div>
                    <div className="flex flex-col gap-space-2xs">
                      <h3 className="font-label-lg text-label-lg text-primary">{entry.name}</h3>
                      <p className="font-body-md text-body-md text-on-surface-variant">
                        {entry.preparationInstructions ?? "No special preparation required."}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ) : null}

          {!hasRadiology && !hasLab ? (
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
              <p className="font-body-md text-body-md text-on-surface-variant">
                No special preparation required.
              </p>
            </div>
          ) : null}

          <button
            onClick={() => navigate("SLOT_SELECTION")}
            className="w-full sm:w-auto self-end inline-flex items-center justify-center gap-space-xs px-space-xl py-space-sm rounded-full bg-secondary text-on-secondary font-label-lg text-label-lg shadow-sm hover:opacity-95 transition-all min-h-[52px]"
            type="button"
          >
            <span>Got it, Continue</span>
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
        </div>

        <aside className="lg:col-span-4 flex flex-col gap-space-lg">
          <div className="bg-surface-container-low rounded-xl p-space-md flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-primary text-[20px]">room_service</span>
            <p className="font-caption text-caption text-on-surface-variant">
              Our team prepares your suite ahead of time so your visit stays quick and comfortable.
            </p>
          </div>
          <div className="bg-surface-container-low rounded-xl p-space-md space-y-space-xs">
            <div className="flex items-center gap-space-xs text-primary">
              <span className="material-symbols-outlined text-[20px]">help_outline</span>
              <span className="font-label-lg text-label-lg">Cannot follow the prep?</span>
            </div>
            <p className="font-caption text-caption text-on-surface-variant leading-relaxed">
              If medical circumstances prevent strict fasting or hydration, please contact our
              triage desk immediately to adjust your appointment time.
            </p>
            <a
              className="inline-flex items-center gap-1 font-label-md text-label-md text-primary hover:text-secondary font-semibold transition-colors"
              href="tel:+18004927527"
            >
              <span>Contact Clinical Coordinator</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </a>
          </div>
        </aside>
      </div>
    </>
  );
}
