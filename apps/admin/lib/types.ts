export type Modality = "ULTRASOUND" | "XRAY" | "CT" | "MRI" | "ECG";
export type BodyPartCategory =
  | "HEAD_NECK"
  | "CHEST_CARDIAC"
  | "ABDOMEN_PELVIS"
  | "SPINE"
  | "UPPER_LIMB"
  | "LOWER_LIMB"
  | "WHOLE_BODY";
export type SlotType = "RADIOLOGY" | "LAB" | "HOME_COLLECTION_WINDOW";
export type BookingStatus = "PENDING_PAYMENT" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
export type BookingType = "RADIOLOGY" | "LAB" | "COMBINED";
export type PaymentMode = "ONLINE_ONLY" | "ONLINE_AND_RECEPTION";
export type NotificationChannel = "SMS" | "EMAIL" | "WHATSAPP";

export interface AdminSelf {
  id: string;
  email: string;
  name: string;
  organizationId: string;
}

export interface RadiologyExam {
  id: string;
  name: string;
  modality: Modality;
  bodyPartCategory: BodyPartCategory;
  requiresSafetyCheck: boolean;
  preparationInstructions: string | null;
  price: number;
  payAtReceptionEligible: boolean;
}

export interface LabTest {
  id: string;
  name: string;
  category: string;
  isPackage: boolean;
  includedParameters: string[];
  preparationInstructions: string | null;
  price: number;
  homeCollectionEligible: boolean;
  payAtReceptionEligible: boolean;
}

export interface Centre {
  id: string;
  name: string;
  address: string;
  city: string;
  area: string;
  lat: number | null;
  lng: number | null;
  offersRadiology: boolean;
  offersLab: boolean;
}

export interface ServiceableArea {
  id: string;
  pinCode: string;
  homeCollectionCharge: number;
  isActive: boolean;
}

export interface RadiologyOffering {
  centreId: string;
  centreName?: string;
  radiologyExamId: string;
  radiologyExamName?: string;
  basePrice: number;
  offered: boolean;
  priceOverride: number | null;
}

export interface LabOffering {
  centreId: string;
  centreName?: string;
  labTestId: string;
  labTestName?: string;
  basePrice: number;
  offered: boolean;
  priceOverride: number | null;
}

export interface SlotRow {
  id: string;
  type: SlotType;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
}

export interface SlotDay {
  date: string;
  slots: SlotRow[];
}

export interface BookingListItem {
  id: string;
  bookingCode: string;
  status: BookingStatus;
  type: BookingType;
  totalAmount: number;
  patientName: string | null;
  patientMobile: string;
  centre: { id: string; name: string };
  createdAt: string;
}

export interface BookingDetail {
  id: string;
  bookingCode: string;
  status: BookingStatus;
  type: BookingType;
  paymentMethod: string;
  collectionMode: string | null;
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
  schedule: Array<{ type: string; date: string; startTime: string; endTime: string }>;
  safetyCheck: Array<{ questionKey: string; answer: string; flagged: boolean }>;
  createdAt: string;
}

export interface SentNotificationRow {
  id: string;
  bookingId: string;
  bookingCode: string;
  channel: NotificationChannel;
  to: string;
  subject: string | null;
  body: string;
  sentAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string | null;
  paymentMode: PaymentMode;
  emailNotificationsEnabled: boolean;
  whatsappNotificationsEnabled: boolean;
  remindersEnabled: boolean;
}
