import type {
  AdminSelf,
  BookingDetail,
  BookingListItem,
  BookingStatus,
  Centre,
  LabOffering,
  LabTest,
  Organization,
  RadiologyExam,
  RadiologyOffering,
  SentNotificationRow,
  ServiceableArea,
  SlotDay,
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
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json() : null;
  if (!res.ok) {
    throw new ApiError(res.status, body?.error ?? `Request failed with status ${res.status}`);
  }
  return body as T;
}

function withBody(method: string, body?: unknown): RequestInit {
  return { method, body: body === undefined ? undefined : JSON.stringify(body) };
}

export const api = {
  // -------------------------------------------------------------------------
  // Auth
  // -------------------------------------------------------------------------
  login: (email: string, password: string) =>
    request<AdminSelf>("/api/admin/auth/login", withBody("POST", { email, password })),
  logout: () => request<{ ok: true }>("/api/admin/auth/logout", withBody("POST")),
  me: () => request<AdminSelf>("/api/admin/auth/me"),

  // -------------------------------------------------------------------------
  // Dashboard
  // -------------------------------------------------------------------------
  dashboard: (params: { centreId?: string; status?: BookingStatus } = {}) => {
    const search = new URLSearchParams();
    if (params.centreId) search.set("centreId", params.centreId);
    if (params.status) search.set("status", params.status);
    return request<{
      todayBookingsCount: number;
      upcomingBookings: BookingListItem[];
      centres: Array<{ id: string; name: string }>;
    }>(`/api/admin/dashboard?${search.toString()}`);
  },

  // -------------------------------------------------------------------------
  // Catalogue — radiology exams
  // -------------------------------------------------------------------------
  radiologyExams: () => request<{ exams: RadiologyExam[] }>("/api/admin/radiology-exams"),
  radiologyExam: (id: string) =>
    request<{ exam: RadiologyExam }>(`/api/admin/radiology-exams/${id}`),
  createRadiologyExam: (data: Partial<RadiologyExam>) =>
    request<{ exam: RadiologyExam }>("/api/admin/radiology-exams", withBody("POST", data)),
  updateRadiologyExam: (id: string, data: Partial<RadiologyExam>) =>
    request<{ exam: RadiologyExam }>(`/api/admin/radiology-exams/${id}`, withBody("PATCH", data)),
  deleteRadiologyExam: (id: string) =>
    request<void>(`/api/admin/radiology-exams/${id}`, withBody("DELETE")),

  // -------------------------------------------------------------------------
  // Catalogue — lab tests
  // -------------------------------------------------------------------------
  labTests: () => request<{ tests: LabTest[] }>("/api/admin/lab-tests"),
  labTest: (id: string) => request<{ test: LabTest }>(`/api/admin/lab-tests/${id}`),
  createLabTest: (data: Partial<LabTest>) =>
    request<{ test: LabTest }>("/api/admin/lab-tests", withBody("POST", data)),
  updateLabTest: (id: string, data: Partial<LabTest>) =>
    request<{ test: LabTest }>(`/api/admin/lab-tests/${id}`, withBody("PATCH", data)),
  deleteLabTest: (id: string) => request<void>(`/api/admin/lab-tests/${id}`, withBody("DELETE")),

  // -------------------------------------------------------------------------
  // Centre <-> item offerings
  // -------------------------------------------------------------------------
  radiologyOfferingsForExam: (examId: string) =>
    request<{ offerings: RadiologyOffering[] }>(
      `/api/admin/centre-radiology-offerings?radiologyExamId=${examId}`,
    ),
  radiologyOfferingsForCentre: (centreId: string) =>
    request<{ offerings: RadiologyOffering[] }>(
      `/api/admin/centre-radiology-offerings?centreId=${centreId}`,
    ),
  setRadiologyOffering: (data: {
    centreId: string;
    radiologyExamId: string;
    offered: boolean;
    priceOverride: number | null;
  }) => request<RadiologyOffering>("/api/admin/centre-radiology-offerings", withBody("PUT", data)),

  labOfferingsForTest: (labTestId: string) =>
    request<{ offerings: LabOffering[] }>(`/api/admin/centre-lab-offerings?labTestId=${labTestId}`),
  labOfferingsForCentre: (centreId: string) =>
    request<{ offerings: LabOffering[] }>(`/api/admin/centre-lab-offerings?centreId=${centreId}`),
  setLabOffering: (data: {
    centreId: string;
    labTestId: string;
    offered: boolean;
    priceOverride: number | null;
  }) => request<LabOffering>("/api/admin/centre-lab-offerings", withBody("PUT", data)),

  // -------------------------------------------------------------------------
  // Centres
  // -------------------------------------------------------------------------
  centres: () => request<{ centres: Centre[] }>("/api/admin/centres"),
  centre: (id: string) => request<{ centre: Centre }>(`/api/admin/centres/${id}`),
  createCentre: (data: Partial<Centre>) =>
    request<{ centre: Centre }>("/api/admin/centres", withBody("POST", data)),
  updateCentre: (id: string, data: Partial<Centre>) =>
    request<{ centre: Centre }>(`/api/admin/centres/${id}`, withBody("PATCH", data)),
  deleteCentre: (id: string) => request<void>(`/api/admin/centres/${id}`, withBody("DELETE")),

  serviceableAreas: (centreId: string) =>
    request<{ areas: ServiceableArea[] }>(`/api/admin/centres/${centreId}/serviceable-areas`),
  createServiceableArea: (
    centreId: string,
    data: { pinCode: string; homeCollectionCharge: number; isActive?: boolean },
  ) =>
    request<{ area: ServiceableArea }>(
      `/api/admin/centres/${centreId}/serviceable-areas`,
      withBody("POST", data),
    ),
  updateServiceableArea: (id: string, data: Partial<ServiceableArea>) =>
    request<{ area: ServiceableArea }>(
      `/api/admin/serviceable-areas/${id}`,
      withBody("PATCH", data),
    ),
  deleteServiceableArea: (id: string) =>
    request<void>(`/api/admin/serviceable-areas/${id}`, withBody("DELETE")),

  // -------------------------------------------------------------------------
  // Slots
  // -------------------------------------------------------------------------
  slotsForCentre: (centreId: string, days = 14) =>
    request<{ centreId: string; days: SlotDay[] }>(
      `/api/admin/centres/${centreId}/slots?days=${days}`,
    ),
  generateSlots: (
    centreId: string,
    data: {
      type: string;
      days: number;
      startHour: number;
      endHour: number;
      slotsPerHour: number;
      capacityPerSlot: number;
    },
  ) =>
    request<{ requested: number; created: number }>(
      `/api/admin/centres/${centreId}/slots/generate`,
      withBody("POST", data),
    ),
  deleteSlot: (id: string) => request<void>(`/api/admin/slots/${id}`, withBody("DELETE")),

  // -------------------------------------------------------------------------
  // Bookings
  // -------------------------------------------------------------------------
  bookings: (params: { status?: string; centreId?: string; q?: string; page?: number } = {}) => {
    const search = new URLSearchParams();
    if (params.status) search.set("status", params.status);
    if (params.centreId) search.set("centreId", params.centreId);
    if (params.q) search.set("q", params.q);
    if (params.page) search.set("page", String(params.page));
    return request<{ total: number; page: number; pageSize: number; bookings: BookingListItem[] }>(
      `/api/admin/bookings?${search.toString()}`,
    );
  },
  booking: (id: string) => request<BookingDetail>(`/api/admin/bookings/${id}`),
  completeBooking: (id: string) =>
    request<{ status: string }>(`/api/admin/bookings/${id}/complete`, withBody("POST")),

  // -------------------------------------------------------------------------
  // Notifications
  // -------------------------------------------------------------------------
  notifications: (params: { bookingId?: string; channel?: string; page?: number } = {}) => {
    const search = new URLSearchParams();
    if (params.bookingId) search.set("bookingId", params.bookingId);
    if (params.channel) search.set("channel", params.channel);
    if (params.page) search.set("page", String(params.page));
    return request<{
      total: number;
      page: number;
      pageSize: number;
      notifications: SentNotificationRow[];
    }>(`/api/admin/notifications?${search.toString()}`);
  },

  // -------------------------------------------------------------------------
  // Organization settings
  // -------------------------------------------------------------------------
  organization: () => request<{ organization: Organization }>("/api/admin/organization"),
  updateOrganization: (
    data: Partial<
      Pick<Organization, "paymentMode" | "logoUrl" | "primaryColor" | "remindersEnabled">
    >,
  ) => request<{ organization: Organization }>("/api/admin/organization", withBody("PATCH", data)),
};
