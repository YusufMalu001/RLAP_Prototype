export type Modality = "ULTRASOUND" | "XRAY" | "CT" | "MRI" | "ECG";

export type BodyPartCategory =
  | "HEAD_NECK"
  | "CHEST_CARDIAC"
  | "ABDOMEN_PELVIS"
  | "SPINE"
  | "UPPER_LIMB"
  | "LOWER_LIMB"
  | "WHOLE_BODY";

export type CartItemType = "RADIOLOGY_EXAM" | "LAB_TEST" | "HOME_COLLECTION_CHARGE";
export type CartType = "RADIOLOGY" | "LAB" | "COMBINED" | null;
export type CollectionMode = "CENTRE_VISIT" | "HOME_COLLECTION";
export type SlotType = "RADIOLOGY" | "LAB" | "HOME_COLLECTION_WINDOW";
export type Gender = "MALE" | "FEMALE" | "OTHER";
export type PaymentMethod = "ONLINE" | "PAY_AT_RECEPTION";

export interface SearchResult {
  type: "SCAN" | "TEST";
  id: string;
  name: string;
  price: number;
  modality?: Modality;
  bodyPartCategory?: BodyPartCategory;
  requiresSafetyCheck?: boolean;
  category?: string;
  isPackage?: boolean;
  homeCollectionEligible?: boolean;
}

export interface RadiologyExamSummary {
  id: string;
  name: string;
  modality: Modality;
  bodyPartCategory: BodyPartCategory;
  requiresSafetyCheck: boolean;
  price: number;
}

export interface LabTestSummary {
  id: string;
  name: string;
  category: string;
  isPackage: boolean;
  price: number;
  homeCollectionEligible: boolean;
}

export interface LabTestDetail extends LabTestSummary {
  includedParameters: string[];
  preparationInstructions: string | null;
}

export interface CentreSummary {
  id: string;
  name: string;
  address: string;
  city: string;
  area: string;
  offersRadiology: boolean;
  offersLab: boolean;
  distanceKm?: number | null;
}

export interface CartItem {
  id: string;
  itemType: CartItemType;
  radiologyExamId?: string;
  labTestId?: string;
  name: string;
  price: number;
  addedAt: string;
  source: "MANUAL" | "OCR";
  ocrConfidence?: "HIGH" | "LOW";
}

export interface SafetyCheckAnswers {
  PREGNANCY: boolean;
  PACEMAKER: boolean;
  IMPLANTS: boolean;
  ALLERGIES: boolean;
}

export interface Cart {
  token: string;
  organizationSlug: string;
  items: CartItem[];
  cartType: CartType;
  subtotal: number;
  collectionMode: CollectionMode | null;
  homeCollectionAddress: {
    pinCode: string;
    houseNumber: string;
    street: string;
    landmark?: string;
  } | null;
  centreId: string | null;
  safetyCheckAnswers: SafetyCheckAnswers | null;
  blockedBySafety: boolean;
  patientId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NudgeResult {
  showNudge: boolean;
  direction: "SUGGEST_LAB" | "SUGGEST_RADIOLOGY" | null;
}

export interface SlotSummary {
  id: string;
  type: SlotType;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  availableCapacity: number;
}

export interface SlotsForCart {
  radiology: SlotSummary[];
  lab: SlotSummary[];
}

export interface HoldStatus {
  expired: boolean;
  remainingSeconds?: number;
  expiresAt?: string;
}

export interface PreparationInstructionEntry {
  id: string;
  name: string;
  preparationInstructions: string | null;
}

export interface PreparationInstructions {
  radiology: PreparationInstructionEntry[];
  lab: PreparationInstructionEntry[];
}

export interface BookingSummary {
  items: Array<{ id: string; itemType: CartItemType; name: string; price: number }>;
  centre: { id: string; name: string; address: string } | null;
  schedule: Array<{ type: SlotType; date: string; startTime: string; endTime: string }>;
  patientName: string | null;
  subtotal: number;
  homeCollectionCharge: number | null;
  total: number;
  payAtReceptionEligible: boolean;
}

export interface ConfirmBookingResult {
  bookingId: string;
  bookingCode: string;
  status: "CONFIRMED" | "PENDING_PAYMENT";
  totalAmount: number;
  paymentIntent?: { bookingId: string; amount: number };
}

export interface PayResult {
  success: boolean;
  status: string;
  bookingCode?: string;
  failureReason?: string;
}

export interface BookingDetail {
  id: string;
  bookingCode: string;
  status: string;
  type: CartType;
  paymentMethod: PaymentMethod;
  collectionMode: CollectionMode | null;
  totalAmount: number;
  centre: { id: string; name: string; address: string };
  patient: { name: string | null; mobileNumber: string };
  lineItems: Array<{
    id: string;
    itemType: string;
    name: string;
    price: number;
    source: string;
    ocrConfidence: string | null;
    preparationInstructions: string | null;
  }>;
  schedule: Array<{ type: SlotType; date: string; startTime: string; endTime: string }>;
  createdAt: string;
}

export interface VerifyOtpResult {
  sessionToken: string;
  expiresAt: string;
  isExistingPatient: boolean;
  patient: {
    id: string;
    mobileNumber: string;
    name: string | null;
    dobOrAge: string | null;
    gender: Gender | null;
    email: string | null;
  };
}

export interface SendOtpResult {
  resendAvailableInSeconds: number;
  devOtp?: string;
}

export interface OcrMergeResult {
  totalFailure: boolean;
  addedHigh: CartItem[];
  addedLow: CartItem[];
  unmatched: string[];
  cart: Cart;
}

export interface PinCheckResult {
  serviceable: boolean;
  homeCollectionCharge: number | null;
}

export interface ReportBooking {
  id: string;
  bookingCode: string;
  type: CartType;
  centre: { id: string; name: string };
  items: string[];
  totalAmount: number;
  createdAt: string;
}

export type SmokingStatus = "NEVER" | "FORMER" | "CURRENT";
export type AlcoholConsumption = "NONE" | "OCCASIONAL" | "REGULAR";

export interface PatientFull {
  id: string;
  mobileNumber: string;
  name: string | null;
  dobOrAge: string | null;
  gender: Gender | null;
  email: string | null;
  heightCm: number | null;
  weightKg: number | null;
  allergies: string | null;
  chronicConditions: string | null;
  currentMedications: string | null;
  familyMedicalHistory: string | null;
  smokingStatus: SmokingStatus | null;
  alcoholConsumption: AlcoholConsumption | null;
  medicalNotes: string | null;
}

export interface MedicalHistoryInput {
  heightCm?: number | null;
  weightKg?: number | null;
  allergies?: string | null;
  chronicConditions?: string | null;
  currentMedications?: string | null;
  familyMedicalHistory?: string | null;
  smokingStatus?: SmokingStatus | null;
  alcoholConsumption?: AlcoholConsumption | null;
  medicalNotes?: string | null;
}

export interface PatientProfile {
  patient: PatientFull;
  reports: ReportBooking[];
}

export interface LabRecommendation {
  id: string;
  name: string;
  category: string;
  price: number;
  homeCollectionEligible: boolean;
  rationale: string;
}
