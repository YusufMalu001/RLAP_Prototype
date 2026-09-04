export type CartItemType = "RADIOLOGY_EXAM" | "LAB_TEST" | "HOME_COLLECTION_CHARGE";

export type CartType = "RADIOLOGY" | "LAB" | "COMBINED" | null;

export type CollectionMode = "CENTRE_VISIT" | "HOME_COLLECTION";

export type CartItemSource = "MANUAL" | "OCR";
export type CartItemOcrConfidence = "HIGH" | "LOW";

export interface CartItem {
  id: string;
  itemType: CartItemType;
  radiologyExamId?: string;
  labTestId?: string;
  name: string;
  price: number;
  addedAt: string;
  source: CartItemSource;
  ocrConfidence?: CartItemOcrConfidence;
}

export interface HomeCollectionAddress {
  pinCode: string;
  houseNumber: string;
  street: string;
  landmark?: string;
}

export const SAFETY_CHECK_QUESTIONS = ["PREGNANCY", "PACEMAKER", "IMPLANTS", "ALLERGIES"] as const;
export type SafetyCheckQuestionKey = (typeof SAFETY_CHECK_QUESTIONS)[number];
export type SafetyCheckAnswers = Record<SafetyCheckQuestionKey, boolean>;

export interface Cart {
  token: string;
  organizationId: string;
  organizationSlug: string;
  items: CartItem[];
  collectionMode: CollectionMode | null;
  homeCollectionAddress: HomeCollectionAddress | null;
  centreId: string | null;
  safetyCheckAnswers: SafetyCheckAnswers | null;
  // Set by otpService.verifyOtp when it's called with this cart's token (§3.6) — "patient
  // identified" for POST /cart/:token/confirm's validation means this is non-null.
  patientId: string | null;
  createdAt: string;
  updatedAt: string;
}
