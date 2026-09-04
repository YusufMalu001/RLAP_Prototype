import type {
  BodyPartCategory,
  BookingDetail,
  BookingSummary,
  Cart,
  CentreSummary,
  ConfirmBookingResult,
  Gender,
  HoldStatus,
  LabTestDetail,
  LabTestSummary,
  Modality,
  NudgeResult,
  OcrMergeResult,
  PayResult,
  PaymentMethod,
  PinCheckResult,
  PreparationInstructions,
  RadiologyExamSummary,
  ReportBooking,
  SafetyCheckAnswers,
  SearchResult,
  SendOtpResult,
  SlotsForCart,
  VerifyOtpResult,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers:
      init?.body instanceof FormData
        ? init.headers
        : { "Content-Type": "application/json", ...init?.headers },
  });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json() : null;
  if (!res.ok) {
    throw new ApiError(res.status, body?.error ?? `Request failed with status ${res.status}`);
  }
  return body as T;
}

function json(body: unknown): RequestInit {
  return { method: "POST", body: JSON.stringify(body) };
}

// ---------------------------------------------------------------------------
// Catalogue
// ---------------------------------------------------------------------------

export const api = {
  search: (orgSlug: string, q: string) =>
    request<{ query: string; results: SearchResult[] }>(
      `/api/orgs/${orgSlug}/search?q=${encodeURIComponent(q)}`,
    ),

  radiologyModalities: (orgSlug: string) =>
    request<{ modalities: Modality[] }>(`/api/orgs/${orgSlug}/radiology/modalities`),

  radiologyCategories: (orgSlug: string, modality: Modality) =>
    request<{ modality: Modality; categories: BodyPartCategory[] }>(
      `/api/orgs/${orgSlug}/radiology/modalities/${modality}/categories`,
    ),

  radiologyExams: (
    orgSlug: string,
    params: { modality?: Modality; category?: BodyPartCategory },
  ) => {
    const search = new URLSearchParams();
    if (params.modality) search.set("modality", params.modality);
    if (params.category) search.set("category", params.category);
    return request<{ exams: RadiologyExamSummary[] }>(
      `/api/orgs/${orgSlug}/radiology/exams?${search.toString()}`,
    );
  },

  labCategories: (orgSlug: string) =>
    request<{ categories: string[]; packages: LabTestSummary[] }>(
      `/api/orgs/${orgSlug}/lab/categories`,
    ),

  labTests: (orgSlug: string, category?: string) =>
    request<{ tests: LabTestSummary[] }>(
      `/api/orgs/${orgSlug}/lab/tests${category ? `?category=${encodeURIComponent(category)}` : ""}`,
    ),

  labTestDetail: (orgSlug: string, id: string) =>
    request<{ test: LabTestDetail }>(`/api/orgs/${orgSlug}/lab/tests/${id}`),

  // ---------------------------------------------------------------------------
  // Centres
  // ---------------------------------------------------------------------------

  centresNearby: (
    orgSlug: string,
    params: { lat: number; lng: number } | { city: string; area: string },
  ) => request<{ centres: CentreSummary[] }>(`/api/orgs/${orgSlug}/centres/nearby`, json(params)),

  // ---------------------------------------------------------------------------
  // Cart
  // ---------------------------------------------------------------------------

  createCart: (orgSlug: string) => request<Cart>("/api/cart", json({ orgSlug })),

  getCart: (token: string) => request<Cart>(`/api/cart/${token}`),

  addCartItem: (token: string, itemType: "RADIOLOGY_EXAM" | "LAB_TEST", itemId: string) =>
    request<Cart>(`/api/cart/${token}/items`, json({ itemType, itemId })),

  removeCartItem: (token: string, itemId: string) =>
    request<Cart>(`/api/cart/${token}/items/${itemId}`, { method: "DELETE" }),

  nudge: (token: string) => request<NudgeResult>(`/api/cart/${token}/nudge`),

  centresForCart: (token: string) =>
    request<{ centres: CentreSummary[] }>(`/api/cart/${token}/centres`),

  setCentre: (token: string, centreId: string) =>
    request<Cart>(`/api/cart/${token}/centre`, json({ centreId })),

  checkPin: (token: string, pinCode: string) =>
    request<PinCheckResult>(`/api/cart/${token}/home-collection/check-pin`, json({ pinCode })),

  saveHomeAddress: (
    token: string,
    address: { pinCode: string; houseNumber: string; street: string; landmark?: string },
  ) => request<Cart>(`/api/cart/${token}/home-collection/address`, json(address)),

  safetyCheckRequired: (token: string) =>
    request<{ safetyCheckRequired: boolean }>(`/api/cart/${token}/safety-check-required`),

  submitSafetyCheck: (token: string, answers: SafetyCheckAnswers) =>
    request<{ flagged: boolean }>(`/api/cart/${token}/safety-check`, json({ answers })),

  preparationInstructions: (token: string) =>
    request<PreparationInstructions>(`/api/cart/${token}/preparation-instructions`),

  slotsForCart: (token: string, centreId: string, date: string) =>
    request<SlotsForCart>(`/api/cart/${token}/slots?centreId=${centreId}&date=${date}`),

  holdSlot: (token: string, slotId: string) =>
    request<{ slotId: string; expiresAt: string; holdDurationSeconds: number }>(
      `/api/cart/${token}/slots/hold`,
      json({ slotId }),
    ),

  holdStatus: (token: string) => request<HoldStatus>(`/api/cart/${token}/hold-status`),

  summary: (token: string) => request<BookingSummary>(`/api/cart/${token}/summary`),

  confirm: (token: string, paymentMethod: PaymentMethod) =>
    request<ConfirmBookingResult>(`/api/cart/${token}/confirm`, json({ paymentMethod })),

  // ---------------------------------------------------------------------------
  // OTP + patient session
  // ---------------------------------------------------------------------------

  sendOtp: (orgSlug: string, mobile: string) =>
    request<SendOtpResult>(`/api/orgs/${orgSlug}/otp/send`, json({ mobile })),

  verifyOtp: (orgSlug: string, mobile: string, code: string, cartToken?: string) =>
    request<VerifyOtpResult>(`/api/orgs/${orgSlug}/otp/verify`, json({ mobile, code, cartToken })),

  savePatientDetails: (
    sessionToken: string,
    details: { name: string; dobOrAge: string; gender: Gender; email?: string },
  ) => request<{ patient: unknown }>(`/api/patient-session/${sessionToken}/details`, json(details)),

  // ---------------------------------------------------------------------------
  // OCR
  // ---------------------------------------------------------------------------

  uploadPrescription: (orgSlug: string, cartToken: string, file: File) => {
    const form = new FormData();
    form.set("cartToken", cartToken);
    form.set("file", file);
    return request<OcrMergeResult>(`/api/orgs/${orgSlug}/ocr/upload`, {
      method: "POST",
      body: form,
    });
  },

  // ---------------------------------------------------------------------------
  // Bookings
  // ---------------------------------------------------------------------------

  payForBooking: (bookingId: string, forceFail?: boolean) =>
    request<PayResult>(`/api/bookings/${bookingId}/pay`, json({ forceFail: forceFail ?? false })),

  getBooking: (bookingId: string) => request<BookingDetail>(`/api/bookings/${bookingId}`),

  // ---------------------------------------------------------------------------
  // Reports
  // ---------------------------------------------------------------------------

  reportsSendOtp: (orgSlug: string, mobile: string) =>
    request<SendOtpResult>(`/api/orgs/${orgSlug}/reports/send-otp`, json({ mobile })),

  reportsVerifyOtp: (orgSlug: string, mobile: string, code: string) =>
    request<VerifyOtpResult>(`/api/orgs/${orgSlug}/reports/verify-otp`, json({ mobile, code })),

  reports: (orgSlug: string, patientSessionToken: string) =>
    request<{ bookings: ReportBooking[] }>(
      `/api/orgs/${orgSlug}/reports?patientSessionToken=${patientSessionToken}`,
    ),
};
