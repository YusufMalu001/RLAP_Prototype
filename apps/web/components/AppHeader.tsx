"use client";

import Link from "next/link";
import type { ScreenId } from "../lib/store";
import { useWidgetStore } from "../lib/store";
import { Toast } from "./Toast";

const NAV_TABS = [
  {
    label: "Select Diagnostics",
    screens: [
      "HOME",
      "RADIOLOGY_MODALITY",
      "RADIOLOGY_CATEGORY",
      "RADIOLOGY_ITEMS",
      "RADIOLOGY_CART",
      "LAB_CATEGORIES",
      "LAB_ITEM_DETAIL",
      "LAB_CART",
      "COMBINED_CART",
      "UPLOAD_PRESCRIPTION",
      "OCR_PROCESSING",
      "OCR_FAILURE",
    ] as ScreenId[],
  },
  {
    label: "Schedule Time",
    screens: [
      "LOCATION",
      "CENTRE_SELECTION",
      "LAB_COLLECTION_TYPE",
      "LAB_HOME_ADDRESS",
      "SLOT_SELECTION",
    ] as ScreenId[],
  },
  {
    label: "Preparation",
    screens: ["SAFETY_CHECK", "SAFETY_CALLBACK_EXIT", "PREPARATION_INSTRUCTIONS"] as ScreenId[],
  },
  {
    label: "Summary",
    screens: [
      "OTP_VERIFICATION",
      "PATIENT_DETAILS",
      "BOOKING_SUMMARY",
      "PAYMENT",
      "CONFIRMATION",
    ] as ScreenId[],
  },
];

function tabIndexFor(screen: ScreenId): number {
  return NAV_TABS.findIndex((tab) => tab.screens.includes(screen));
}

/** Sticky brand header + stage nav shared by every full-page screen, mirroring the Stitch header. */
export function AppHeader() {
  const screen = useWidgetStore((s) => s.screen);
  const history = useWidgetStore((s) => s.history);
  const reset = useWidgetStore((s) => s.reset);
  const navigate = useWidgetStore((s) => s.navigate);
  const orgSlug = useWidgetStore((s) => s.orgSlug);

  // The path the patient has actually walked, oldest first, ending at the current screen —
  // used both to cap how far ahead the nav can jump and to resume exactly where they left off.
  const path = [...history, screen];
  const activeIndex = tabIndexFor(screen);
  const maxReachedIndex = path.reduce((max, s) => Math.max(max, tabIndexFor(s)), 0);

  function lastVisitedScreenForTab(tabIndex: number): ScreenId {
    for (let i = path.length - 1; i >= 0; i--) {
      if (tabIndexFor(path[i]!) === tabIndex) return path[i]!;
    }
    return NAV_TABS[tabIndex]!.screens[0]!;
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-surface/90 shadow-[0_1px_8px_rgba(22,59,72,0.04)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between gap-space-md px-margin-mobile lg:px-margin-desktop">
        <div className="flex items-center gap-space-md">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-container text-on-primary">
            <span className="material-symbols-outlined text-[20px]">local_hospital</span>
          </div>
          <div className="flex flex-col">
            <span className="font-label-lg text-label-lg leading-tight tracking-tight text-primary">
              RLAP Diagnostics
            </span>
            <div className="flex items-center gap-space-2xs">
              <span className="h-2 w-2 animate-pulse rounded-full bg-secondary" />
              <span className="font-caption text-caption text-on-surface-variant">
                Private Reception Live
              </span>
            </div>
          </div>
        </div>

        <nav className="relative hidden grid-cols-4 items-stretch rounded-full bg-surface-container-low p-space-2xs shadow-[0_2px_4px_rgba(22,59,72,0.03)] md:grid">
          <div
            aria-hidden
            className="absolute inset-y-[3px] left-[3px] rounded-full bg-primary-container transition-transform duration-300 ease-out"
            style={{
              width: `calc((100% - 6px) / ${NAV_TABS.length})`,
              transform: `translateX(${activeIndex * 100}%)`,
            }}
          />
          {NAV_TABS.map((tab, i) => {
            const active = i === activeIndex;
            const reachable = i <= maxReachedIndex;
            return (
              <button
                key={tab.label}
                disabled={!reachable}
                onClick={() => reachable && navigate(lastVisitedScreenForTab(i))}
                className={`relative z-10 whitespace-nowrap rounded-full px-space-md py-space-xs font-label-md text-label-md transition-colors duration-300 ${
                  active
                    ? "text-on-primary"
                    : reachable
                      ? "text-on-surface-variant hover:text-on-surface"
                      : "cursor-not-allowed text-outline-variant"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-space-xs">
          <button
            aria-label="Close widget"
            onClick={() => reset()}
            className="flex h-10 w-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-surface-container-high"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
          <Link
            href={orgSlug ? `/${orgSlug}/profile` : "#"}
            aria-label="Your patient profile"
            className="ml-space-2xs flex h-8 w-8 items-center justify-center rounded-full bg-primary shadow-[0_2px_6px_rgba(22,59,72,0.15)] transition-transform hover:scale-105"
          >
            <span className="material-symbols-outlined text-[18px] text-on-primary">person</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

interface BreadcrumbProps {
  section: string;
  step: string;
  sessionLabel?: string;
  showBack?: boolean;
}

/** Breadcrumb sub-bar every full-page screen renders at the top of its content — carries the
 * only in-app way to step back (the SPA has one URL, so the browser's own back button can't). */
export function Breadcrumb({ section, step, sessionLabel, showBack = true }: BreadcrumbProps) {
  const goBack = useWidgetStore((s) => s.goBack);
  const history = useWidgetStore((s) => s.history);
  const canGoBack = showBack && history.length > 0;

  return (
    <div className="mb-space-md flex w-full flex-wrap items-center justify-between gap-space-sm pb-space-lg">
      <div className="flex items-center gap-space-xs font-label-md text-label-md text-on-surface-variant">
        {canGoBack ? (
          <button
            onClick={goBack}
            aria-label="Go back"
            className="mr-space-2xs flex h-8 w-8 items-center justify-center rounded-full text-primary transition-colors hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
        ) : null}
        <span>{section}</span>
        <span className="material-symbols-outlined text-[16px] text-outline">chevron_right</span>
        <span className="rounded-full bg-surface-container-high px-space-xs py-space-2xs font-semibold text-primary">
          {step}
        </span>
      </div>
      {sessionLabel ? (
        <div className="hidden items-center gap-space-xs rounded-full bg-surface-container-low px-space-sm py-space-2xs sm:flex">
          <span className="h-2 w-2 rounded-full bg-secondary" />
          <span className="font-caption text-caption text-on-surface-variant">{sessionLabel}</span>
        </div>
      ) : null}
    </div>
  );
}

/** Footer bar shared by every full-page screen, mirroring the Stitch footer. */
export function AppFooter() {
  return (
    <footer className="mt-auto w-full bg-surface-container-low">
      <div className="mx-auto flex max-w-[1180px] flex-col items-center justify-between gap-space-sm px-margin-mobile py-space-lg text-center sm:flex-row sm:text-left lg:px-margin-desktop">
        <div className="flex items-center gap-space-xs">
          <span className="material-symbols-outlined text-[18px] text-secondary">verified_user</span>
          <span className="font-caption text-caption text-on-surface-variant">
            ISO 15189 Certified Diagnostic Center • High-precision Clinical Radiography
          </span>
        </div>
        <div className="flex items-center gap-space-lg">
          <span className="font-caption text-caption text-on-surface-variant">
            Confidential Concierge Line: +1 (800) 492-RLAP
          </span>
          <span className="font-caption text-caption text-outline">© 2024 RLAP Diagnostics Ltd.</span>
        </div>
      </div>
    </footer>
  );
}

/** Shared page frame: fixed header + max-width content well + footer, used by every full-page screen. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background font-body-md text-on-surface">
      <Toast />
      <AppHeader />
      <main className="flex w-full flex-1 flex-col items-center px-margin-mobile py-space-xl pt-16 lg:px-margin-desktop">
        <div className="mx-auto flex w-full max-w-[1080px] flex-col py-space-md lg:py-space-xl">
          {children}
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
