"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ScreenId } from "../lib/store";
import { useWidgetStore } from "../lib/store";
import { FloatingPrimaryAction, PrimaryActionProvider } from "./PrimaryAction";
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
  const router = useRouter();
  const pathname = usePathname();

  const bookHref = orgSlug ? `/${orgSlug}/book` : null;
  // The booking flow's screen state lives in the store, not the URL — pages outside it (like
  // Profile) render this same header, so nav/close must actually change route to get back in.
  const onBookPage = pathname === bookHref;

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

  function goToTab(tabIndex: number) {
    navigate(lastVisitedScreenForTab(tabIndex));
    if (!onBookPage && bookHref) router.push(bookHref);
  }

  return (
    <header className="shrink-0 bg-surface/90 shadow-[0_1px_8px_rgba(22,59,72,0.04)] backdrop-blur-xl">
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
                onClick={() => reachable && goToTab(i)}
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
            aria-label={onBookPage ? "Close widget" : "Back to booking"}
            onClick={() => {
              if (onBookPage) {
                reset();
              } else if (bookHref) {
                router.push(bookHref);
              }
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-surface-container-high"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">
              {onBookPage ? "close" : "arrow_back"}
            </span>
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
  /** For pages outside the booking widget's screen state machine (e.g. Profile, Reports) —
   * renders the back arrow as a real link to this URL instead of the store's goBack(). */
  backHref?: string;
}

/** Breadcrumb sub-bar every full-page screen renders at the top of its content — carries the
 * only in-app way to step back (the SPA has one URL, so the browser's own back button can't). */
export function Breadcrumb({
  section,
  step,
  sessionLabel,
  showBack = true,
  backHref,
}: BreadcrumbProps) {
  const goBack = useWidgetStore((s) => s.goBack);
  const history = useWidgetStore((s) => s.history);
  const canGoBack = showBack && (backHref !== undefined || history.length > 0);

  return (
    <div className="mb-space-md flex w-full flex-wrap items-center justify-between gap-space-sm pb-space-lg">
      <div className="flex items-center gap-space-xs font-label-md text-label-md text-on-surface-variant">
        {canGoBack ? (
          backHref ? (
            <Link
              href={backHref}
              aria-label="Go back"
              className="mr-space-2xs flex h-8 w-8 items-center justify-center rounded-full text-primary transition-colors hover:bg-surface-container-high"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </Link>
          ) : (
            <button
              onClick={goBack}
              aria-label="Go back"
              className="mr-space-2xs flex h-8 w-8 items-center justify-center rounded-full text-primary transition-colors hover:bg-surface-container-high"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
          )
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

/** Footer bar shared by every screen — compact since it now sits inside the modal window rather
 * than at the bottom of a full page. */
export function AppFooter() {
  return (
    <footer className="shrink-0 border-t border-outline-variant bg-surface-container-low">
      <div className="mx-auto flex max-w-[1180px] flex-col items-center justify-between gap-space-2xs px-margin-mobile py-space-sm text-center sm:flex-row sm:text-left lg:px-margin-desktop">
        <div className="flex items-center gap-space-xs">
          <span className="material-symbols-outlined text-[16px] text-secondary">verified_user</span>
          <span className="font-caption text-caption text-on-surface-variant">
            ISO 15189 Certified Diagnostic Center
          </span>
        </div>
        <span className="font-caption text-caption text-outline">© 2024 RLAP Diagnostics Ltd.</span>
      </div>
    </footer>
  );
}

/** The booking widget renders as a centered modal window (~75% of the viewport) floating over a
 * decorative, dimmed backdrop — not a full page. Every screen's own markup/logic is unchanged;
 * only this outer frame changed, from a full page to a windowed dialog with internal scrolling
 * and a slide transition between screens (see WidgetRouter). */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center overflow-hidden bg-on-background/50 p-space-md backdrop-blur-sm sm:p-space-xl">
      {/* Ambient backdrop, visible in the margin around the window */}
      <div
        aria-hidden
        className="animate-float-slow pointer-events-none absolute -top-32 -right-24 h-[26rem] w-[26rem] rounded-full bg-primary-fixed/20 blur-3xl"
      />
      <div
        aria-hidden
        className="animate-float-slow-reverse pointer-events-none absolute -bottom-40 -left-24 h-[24rem] w-[24rem] rounded-full bg-secondary-fixed/20 blur-3xl"
      />

      <Toast />

      <div className="relative flex h-[90vh] w-full max-w-[1180px] flex-col overflow-hidden rounded-2xl bg-background font-body-md text-on-surface shadow-rlap-3 sm:h-[85vh] sm:w-[75vw]">
        <PrimaryActionProvider>
          <AppHeader />
          <main className="flex w-full flex-1 flex-col items-center overflow-y-auto px-margin-mobile py-space-lg pb-24 lg:px-margin-desktop">
            <div className="mx-auto flex w-full max-w-[1080px] flex-col">{children}</div>
          </main>
          <FloatingPrimaryAction />
        </PrimaryActionProvider>
        <AppFooter />
      </div>
    </div>
  );
}
