"use client";

import { useEffect } from "react";
import type { ScreenId } from "../lib/store";
import { useWidgetStore } from "../lib/store";
import { BookingSummary } from "../screens/BookingSummary";
import { CentreSelection } from "../screens/CentreSelection";
import { CombinedCart } from "../screens/CombinedCart";
import { Confirmation } from "../screens/Confirmation";
import { Home } from "../screens/Home";
import { LabCart } from "../screens/LabCart";
import { LabCategories } from "../screens/LabCategories";
import { LabCollectionType } from "../screens/LabCollectionType";
import { LabHomeAddress } from "../screens/LabHomeAddress";
import { LabItemDetail } from "../screens/LabItemDetail";
import { Location } from "../screens/Location";
import { OcrFailure } from "../screens/OcrFailure";
import { OcrProcessing } from "../screens/OcrProcessing";
import { OtpVerification } from "../screens/OtpVerification";
import { Payment } from "../screens/Payment";
import { PatientDetails } from "../screens/PatientDetails";
import { PreparationInstructions } from "../screens/PreparationInstructions";
import { RadiologyCart } from "../screens/RadiologyCart";
import { RadiologyCategory } from "../screens/RadiologyCategory";
import { RadiologyItems } from "../screens/RadiologyItems";
import { RadiologyModality } from "../screens/RadiologyModality";
import { SafetyCallbackExit } from "../screens/SafetyCallbackExit";
import { SafetyCheck } from "../screens/SafetyCheck";
import { SlotSelection } from "../screens/SlotSelection";
import { UploadPrescription } from "../screens/UploadPrescription";

export function WidgetRouter({ orgSlug }: { orgSlug: string }) {
  const init = useWidgetStore((s) => s.init);
  const screen = useWidgetStore((s) => s.screen);

  useEffect(() => {
    void init(orgSlug);
  }, [orgSlug, init]);

  // The key change forces a remount on every screen change, which replays the slide-in
  // animation — a lightweight stand-in for a real page-transition library, since the store
  // swaps screens synchronously rather than through routing.
  return (
    <div key={screen} className="animate-slide-in-x w-full">
      {renderScreen(screen)}
    </div>
  );
}

function renderScreen(screen: ScreenId) {
  switch (screen) {
    case "HOME":
      return <Home />;
    case "RADIOLOGY_MODALITY":
      return <RadiologyModality />;
    case "RADIOLOGY_CATEGORY":
      return <RadiologyCategory />;
    case "RADIOLOGY_ITEMS":
      return <RadiologyItems />;
    case "RADIOLOGY_CART":
      return <RadiologyCart />;
    case "LAB_CATEGORIES":
      return <LabCategories />;
    case "LAB_ITEM_DETAIL":
      return <LabItemDetail />;
    case "LAB_CART":
      return <LabCart />;
    case "LAB_COLLECTION_TYPE":
      return <LabCollectionType />;
    case "LAB_HOME_ADDRESS":
      return <LabHomeAddress />;
    case "COMBINED_CART":
      return <CombinedCart />;
    case "LOCATION":
      return <Location />;
    case "CENTRE_SELECTION":
      return <CentreSelection />;
    case "SAFETY_CHECK":
      return <SafetyCheck />;
    case "SAFETY_CALLBACK_EXIT":
      return <SafetyCallbackExit />;
    case "PREPARATION_INSTRUCTIONS":
      return <PreparationInstructions />;
    case "SLOT_SELECTION":
      return <SlotSelection />;
    case "UPLOAD_PRESCRIPTION":
      return <UploadPrescription />;
    case "OCR_PROCESSING":
      return <OcrProcessing />;
    case "OCR_FAILURE":
      return <OcrFailure />;
    case "OTP_VERIFICATION":
      return <OtpVerification />;
    case "PATIENT_DETAILS":
      return <PatientDetails />;
    case "BOOKING_SUMMARY":
      return <BookingSummary />;
    case "PAYMENT":
      return <Payment />;
    case "CONFIRMATION":
      return <Confirmation />;
    default:
      return <Home />;
  }
}
