"use client";

import { useState } from "react";
import { Breadcrumb } from "../components/AppHeader";
import { useWidgetStore } from "../lib/store";

/** L5a — Home Address & PIN Validation. */
export function LabHomeAddress() {
  const checkPin = useWidgetStore((s) => s.checkPin);
  const saveHomeAddress = useWidgetStore((s) => s.saveHomeAddress);
  const pinCheck = useWidgetStore((s) => s.pinCheck);
  const navigate = useWidgetStore((s) => s.navigate);
  const loading = useWidgetStore((s) => s.loading);

  const [pin, setPin] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [street, setStreet] = useState("");
  const [landmark, setLandmark] = useState("");

  const pinChecked = pinCheck !== null && pin.length === 6;
  const canContinue = pinChecked && pinCheck?.serviceable && houseNumber.trim() && street.trim();

  // Not-serviceable state — matches the dedicated Stitch "PIN Not Serviceable" screen.
  if (pinCheck && pin.length === 6 && !pinCheck.serviceable) {
    return (
      <>
        <Breadcrumb section="Laboratory" step="Address Verification" sessionLabel="Step 3 of 4" />

        <div className="grid grid-cols-1 items-start gap-space-xl pb-space-2xl lg:grid-cols-12">
          {/* Left / Core reassurance */}
          <div className="flex flex-col gap-space-lg lg:col-span-7">
            <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-space-xl shadow-sm sm:p-space-2xl">
              <div className="pointer-events-none absolute -top-12 -right-12 h-48 w-48 rounded-full bg-secondary-fixed/30 blur-2xl" />
              <div className="relative z-10 flex flex-col items-start">
                <div className="relative mb-space-lg">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface-container-low shadow-inner">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary-fixed/50 shadow-sm">
                      <span className="material-symbols-outlined text-[32px] text-secondary">
                        wrong_location
                      </span>
                    </div>
                  </div>
                  <div className="absolute -right-1 -bottom-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary-container text-on-primary shadow-md">
                    <span className="material-symbols-outlined text-[15px]">verified</span>
                  </div>
                </div>
                <span className="mb-space-2xs font-caption text-caption font-bold uppercase tracking-wider text-secondary">
                  Service Availability Check
                </span>
                <h1 className="mb-space-sm font-headline-lg text-headline-lg text-primary">
                  This PIN isn&apos;t serviceable for home collection yet
                </h1>
                <p className="mb-space-xl font-body-lg text-body-lg text-on-surface-variant">
                  Our mobile phlebotomy units currently serve central metropolitan zones to guarantee
                  under-45-minute cold-chain specimen transfer directly to our central laboratory. We
                  don&apos;t have active doorstep coverage at{" "}
                  <strong className="rounded bg-surface-container px-space-xs py-0.5 font-semibold text-primary">
                    PIN {pin}
                  </strong>{" "}
                  quite yet.
                </p>

                <div className="mb-space-lg w-full rounded-lg bg-surface-container-low p-space-md">
                  <label className="mb-space-xs block font-label-md text-label-md font-semibold text-primary">
                    Try Another Postal PIN
                  </label>
                  <div className="flex flex-col gap-space-xs sm:flex-row">
                    <div className="relative flex-1">
                      <span className="material-symbols-outlined absolute top-1/2 left-space-md -translate-y-1/2 text-[20px] text-outline-variant">
                        pin_drop
                      </span>
                      <input
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        maxLength={6}
                        placeholder="Enter 6 digit PIN"
                        className="h-touch-target-min w-full rounded-lg bg-surface-container-lowest pl-11 pr-space-md font-body-md text-on-surface shadow-sm outline-none transition-shadow placeholder:text-outline focus:shadow-md"
                      />
                    </div>
                    <button
                      disabled={pin.length !== 6 || loading}
                      onClick={() => void checkPin(pin)}
                      className="flex h-touch-target-min shrink-0 items-center justify-center gap-space-2xs rounded-lg bg-primary-container px-space-lg font-label-lg text-on-primary shadow-sm transition-opacity hover:opacity-95 disabled:opacity-40"
                    >
                      <span>Check PIN</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start justify-between gap-space-md rounded-xl bg-surface-container-low p-space-lg sm:flex-row sm:items-center">
              <div className="flex items-start gap-space-md">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary">
                  <span className="material-symbols-outlined text-[20px]">support_agent</span>
                </div>
                <div>
                  <h2 className="font-title-md text-title-md text-primary">
                    Prefer personalized scheduling?
                  </h2>
                  <p className="mt-0.5 font-body-md text-body-md text-on-surface-variant">
                    Our clinical desk can arrange private medical transport or review out-of-zone
                    priority phlebotomy dispatches.
                  </p>
                </div>
              </div>
              <a
                href="tel:+18004927527"
                className="inline-flex shrink-0 items-center gap-space-2xs rounded-full bg-surface-container-lowest px-space-md py-space-xs font-label-md text-label-md text-primary shadow-sm transition-all hover:bg-primary hover:text-on-primary"
              >
                <span className="material-symbols-outlined text-[16px]">call</span>
                <span>(800) 492-RLAP</span>
              </a>
            </div>
          </div>

          {/* Right / Recommended centre */}
          <div className="flex flex-col gap-space-md lg:col-span-5">
            <div className="rounded-xl bg-surface-container-low p-space-lg shadow-sm">
              <p className="font-label-lg text-label-lg text-primary">Recommended Alternative</p>
              <p className="mt-space-2xs font-body-md text-body-md text-on-surface-variant">
                Visit a nearby RLAP centre instead — no penalty or fee for switching to in-centre
                testing.
              </p>
              <button
                onClick={() => navigate("LOCATION")}
                className="mt-space-md flex h-touch-target-min w-full items-center justify-center gap-space-xs rounded-lg bg-secondary font-label-lg text-label-lg text-on-secondary shadow-[0_4px_14px_rgba(154,68,45,0.25)] transition-all hover:opacity-95"
              >
                <span>Find Nearest Centre Instead</span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
            </div>

            <div className="flex items-center gap-space-md rounded-xl bg-surface-container-low p-space-md">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-container-lowest text-primary shadow-sm">
                <span className="material-symbols-outlined text-[24px]">ac_unit</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-md text-label-md font-semibold text-primary">
                  Strict 4°C Thermal Chain Policy
                </span>
                <span className="font-caption text-caption text-on-surface-variant">
                  We restrict distance parameters solely to ensure clinical purity for your diagnostics.
                </span>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Default / serviceable form state.
  return (
    <>
      <Breadcrumb section="Laboratory" step="Address Details" sessionLabel="Step 3 of 4" />

      <div className="mb-space-xl">
        <h1 className="font-headline-lg text-headline-lg tracking-tight text-primary">
          Enter Home Collection Address
        </h1>
        <p className="mt-space-xs max-w-2xl font-body-md text-body-md text-on-surface-variant">
          Verify service coverage in your neighborhood and provide your collection location for our
          certified mobile phlebotomy unit.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-gutter-desktop pb-space-2xl lg:grid-cols-12">
        {/* Left column: PIN + address form */}
        <div className="flex flex-col gap-space-lg lg:col-span-7">
          {/* PIN validation card */}
          <div className="rounded-xl bg-surface-container-lowest p-card-pad-lg shadow-[0_2px_4px_rgba(22,59,72,0.03),0_8px_24px_rgba(22,59,72,0.05)]">
            <div className="mb-space-md flex items-center gap-space-xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container-low text-primary-container">
                <span className="material-symbols-outlined text-[20px]">my_location</span>
              </div>
              <div>
                <h2 className="font-title-md text-title-md text-primary">Postal PIN Code</h2>
                <p className="font-caption text-caption text-on-surface-variant">
                  Real-time mobile nurse unit proximity
                </p>
              </div>
            </div>
            <div className="flex flex-col items-stretch gap-space-sm sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute top-1/2 left-space-md -translate-y-1/2 text-[20px] text-outline">
                  pin_drop
                </span>
                <input
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="6-digit PIN"
                  className="h-touch-target-min w-full rounded-lg bg-surface-bright pl-11 pr-space-md font-label-lg text-primary outline-none transition-all focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px_#163b48]"
                />
              </div>
              <button
                disabled={pin.length !== 6 || loading}
                onClick={() => void checkPin(pin)}
                className="flex h-touch-target-min items-center justify-center gap-space-xs rounded-lg bg-primary-container px-space-lg font-label-lg text-on-primary shadow-sm transition-all hover:bg-primary active:scale-[0.98] disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-[18px]">travel_explore</span>
                <span>Check Availability</span>
              </button>
            </div>

            {pinCheck?.serviceable && pin.length === 6 ? (
              <div className="mt-space-md flex flex-col items-start justify-between gap-space-md rounded-xl bg-surface-container-low p-space-md sm:flex-row sm:items-center">
                <div className="flex items-start gap-space-sm">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container text-primary-fixed sm:mt-0">
                    <span className="material-symbols-outlined text-[20px]">verified</span>
                  </div>
                  <div>
                    <p className="font-label-lg text-label-lg text-primary">
                      PIN {pin} is serviceable — home collection charge ₹{pinCheck.homeCollectionCharge}
                    </p>
                    <p className="mt-0.5 font-caption text-caption text-on-surface-variant">
                      Please complete the address details below to continue.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Address details form — shown once serviceable */}
          {pinCheck?.serviceable && pin.length === 6 ? (
            <div className="space-y-space-lg rounded-xl bg-surface-container-lowest p-card-pad-lg shadow-[0_2px_4px_rgba(22,59,72,0.03),0_8px_24px_rgba(22,59,72,0.05)]">
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="font-title-md text-title-md text-primary">
                    Collection Premises Details
                  </h2>
                  <span className="font-caption text-caption text-on-surface-variant">
                    Validated Location
                  </span>
                </div>
                <p className="font-caption text-caption text-on-surface-variant">
                  Provide precise entry instructions for our clinical courier team.
                </p>
              </div>

              <div className="space-y-space-md">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-label-md text-label-md text-primary">
                      House / Flat / Suite No.
                    </label>
                    <span className="font-caption text-caption text-outline">Required</span>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute top-1/2 left-space-md -translate-y-1/2 text-[20px] text-outline">
                      door_front
                    </span>
                    <input
                      value={houseNumber}
                      onChange={(e) => setHouseNumber(e.target.value)}
                      placeholder="e.g. Apt 4B, The Belvoir Residences"
                      className="h-touch-target-min w-full rounded-lg bg-surface-bright pl-11 pr-space-md font-body-md text-primary outline-none transition-all focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px_#163b48]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-label-md text-label-md text-primary">
                      Street / Locality / Building Name
                    </label>
                    <span className="font-caption text-caption text-outline">Required</span>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute top-1/2 left-space-md -translate-y-1/2 text-[20px] text-outline">
                      map
                    </span>
                    <input
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="e.g. 742 North Michigan Avenue"
                      className="h-touch-target-min w-full rounded-lg bg-surface-bright pl-11 pr-space-md font-body-md text-primary outline-none transition-all focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px_#163b48]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-label-md text-label-md text-primary">
                      Landmark &amp; Clinical Phlebotomy Instructions
                    </label>
                    <span className="font-caption text-caption font-medium text-secondary">
                      Care Preferences
                    </span>
                  </div>
                  <textarea
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    rows={3}
                    placeholder="Optional — e.g. Ring bell 4B, gate code #4821"
                    className="w-full resize-none rounded-lg bg-surface-bright p-space-md font-body-md text-primary outline-none transition-all focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px_#163b48]"
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Right column: summary */}
        <div className="flex flex-col gap-space-lg lg:col-span-5">
          <div className="space-y-space-md rounded-xl bg-surface-container-lowest p-card-pad-lg shadow-[0_2px_4px_rgba(22,59,72,0.03),0_8px_24px_rgba(22,59,72,0.05)]">
            <div className="flex items-center justify-between pb-space-sm">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[22px] text-secondary">
                  medical_services
                </span>
                <h3 className="font-title-md text-title-md text-primary">Service Summary</h3>
              </div>
            </div>

            <div className="rounded-lg bg-surface-container-low p-space-md">
              <div className="flex items-center gap-space-xs pt-1">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                <span className="font-caption text-caption text-on-surface-variant">
                  Home collection charge: ₹{pinCheck?.homeCollectionCharge ?? "—"}
                </span>
              </div>
            </div>

            <div className="rounded-lg bg-surface-container p-space-xs text-center font-caption text-caption text-on-surface-variant">
              HIPAA &amp; GDPR Compliant Patient Data Security
            </div>
          </div>
        </div>
      </div>

      {/* Bottom navigation action bar */}
      <div className="flex flex-col items-center justify-between gap-space-md rounded-xl bg-surface-container-lowest p-space-md shadow-[0_4px_16px_rgba(22,59,72,0.06)] sm:flex-row">
        <button
          onClick={() => navigate("LAB_COLLECTION_TYPE")}
          className="flex h-touch-target-min w-full items-center justify-center gap-space-xs rounded-lg px-space-md font-label-lg text-label-lg text-primary transition-colors hover:bg-surface-container sm:w-auto"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Back to Collection Type</span>
        </button>
        <button
          disabled={!canContinue}
          onClick={() =>
            void saveHomeAddress({
              pinCode: pin,
              houseNumber,
              street,
              landmark: landmark || undefined,
            })
          }
          className="flex h-touch-target-min w-full items-center justify-center gap-space-sm rounded-lg bg-secondary px-space-xl font-label-lg text-label-lg text-on-secondary shadow-[0_4px_14px_rgba(154,68,45,0.25)] transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        >
          <span>{loading ? "Saving…" : "Confirm Address & Pick Time Slot"}</span>
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </div>
    </>
  );
}
