import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api, ApiError } from "./apiClient";
import type {
  BodyPartCategory,
  Cart,
  CentreSummary,
  Gender,
  Modality,
  PaymentMethod,
  PreparationInstructions,
  SafetyCheckAnswers,
  SlotsForCart,
} from "./types";

// Screen IDs are purpose-named rather than literal spec IDs where the spec itself calls for
// one shared component across several IDs (R6/L5b/C2 -> CENTRE_SELECTION, etc.) — see the
// comment on each for the spec screen(s) it covers.
export type ScreenId =
  | "HOME" // G0
  | "RADIOLOGY_MODALITY" // R1
  | "RADIOLOGY_CATEGORY" // R2
  | "RADIOLOGY_ITEMS" // R3
  | "RADIOLOGY_CART" // R4 (also renders OCR-tagged rows inline — O3 is not a separate screen)
  | "LAB_CATEGORIES" // L1
  | "LAB_ITEM_DETAIL" // L2
  | "LAB_CART" // L3
  | "LAB_COLLECTION_TYPE" // L4
  | "LAB_HOME_ADDRESS" // L5a
  | "COMBINED_CART" // C1
  | "LOCATION" // R5 (shared across Radiology/Lab/Combined)
  | "CENTRE_SELECTION" // R6 / L5b / C2 (shared, parameterized by cartType)
  | "SAFETY_CHECK" // R7 / C3 (shared)
  | "SAFETY_CALLBACK_EXIT" // flagged safety check dead-end
  | "PREPARATION_INSTRUCTIONS" // R8 / L6 / C4 (shared)
  | "SLOT_SELECTION" // R9 / L7 / C5 (shared — 1 or 2 pickers)
  | "UPLOAD_PRESCRIPTION" // O1
  | "OCR_PROCESSING" // O2
  | "OCR_FAILURE" // O4
  | "OTP_VERIFICATION" // SC4
  | "PATIENT_DETAILS" // SC5
  | "BOOKING_SUMMARY" // SC6
  | "PAYMENT" // SC7
  | "CONFIRMATION"; // SC8

/**
 * Adding an item can flip cartType to COMBINED regardless of which flow the patient started
 * in (§2.2) — every "go to my cart" action after an add must re-derive the destination from
 * the cart's actual current type, never assume the screen matching where the add happened.
 */
export function cartScreenFor(cartType: Cart["cartType"]): ScreenId {
  if (cartType === "COMBINED") return "COMBINED_CART";
  if (cartType === "LAB") return "LAB_CART";
  return "RADIOLOGY_CART";
}

interface WidgetState {
  orgSlug: string | null;
  screen: ScreenId;
  history: ScreenId[];

  cartToken: string | null;
  cart: Cart | null;

  // Draft browse state
  selectedModality: Modality | null;
  selectedCategory: BodyPartCategory | null;
  selectedLabCategory: string | null;
  selectedLabTestId: string | null;

  // Split-into-two-bookings recovery (§2.3 empty state) — the second cart's token, parked
  // until the first booking is confirmed.
  pendingSecondCartToken: string | null;

  // Location / centre
  location: { lat: number; lng: number } | { city: string; area: string } | null;
  centres: CentreSummary[];
  centresLoading: boolean;

  // Home collection
  pinCheck: { serviceable: boolean; homeCollectionCharge: number | null } | null;

  // Safety check
  safetyRequired: boolean;

  // Preparation instructions
  preparation: PreparationInstructions | null;

  // Slots
  slotDate: string;
  slots: SlotsForCart | null;
  slotsLoading: boolean;
  holdRemainingSeconds: number | null;
  holdExpired: boolean;
  // A cart with no hold yet also reports {expired: true} from the API (nothing to count
  // down) — this distinguishes "never held anything" from "a hold that actually lapsed", so
  // polling/bounce-back only ever react to a real expiry, never fire before the first hold.
  holdEverPlaced: boolean;

  // OTP / patient session
  mobile: string | null;
  devOtp: string | null;
  resendAvailableInSeconds: number;
  patientSessionToken: string | null;
  isExistingPatient: boolean;
  prefillPatient: {
    name: string | null;
    dobOrAge: string | null;
    gender: Gender | null;
    email: string | null;
  } | null;

  // OCR
  ocrUnmatched: string[];

  // Summary / booking
  summary: import("./types").BookingSummary | null;
  bookingId: string | null;
  bookingCode: string | null;
  paymentAmount: number | null;
  paymentFailureReason: string | null;

  error: string | null;
  loading: boolean;

  // Actions
  init: (orgSlug: string) => Promise<void>;
  navigate: (screen: ScreenId) => void;
  goBack: () => void;
  reset: () => void;
  setError: (message: string | null) => void;

  ensureCart: () => Promise<string>;
  refreshCart: () => Promise<void>;
  addItem: (itemType: "RADIOLOGY_EXAM" | "LAB_TEST", itemId: string) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;

  setModality: (modality: Modality) => void;
  setCategory: (category: BodyPartCategory) => void;
  setLabCategory: (category: string | null) => void;
  setSelectedLabTest: (id: string | null) => void;

  setLocation: (
    loc: { lat: number; lng: number } | { city: string; area: string },
  ) => Promise<void>;
  loadCentresForCart: () => Promise<void>;
  selectCentre: (centreId: string) => Promise<void>;
  splitIntoTwoBookings: () => Promise<void>;
  continueWithSecondCart: () => Promise<void>;

  checkPin: (pinCode: string) => Promise<void>;
  saveHomeAddress: (address: {
    pinCode: string;
    houseNumber: string;
    street: string;
    landmark?: string;
  }) => Promise<void>;

  loadSafetyRequired: () => Promise<boolean>;
  submitSafetyCheck: (answers: SafetyCheckAnswers) => Promise<void>;

  loadPreparation: () => Promise<void>;

  setSlotDate: (date: string) => void;
  loadSlots: (centreId: string, date: string) => Promise<void>;
  holdSlot: (slotId: string) => Promise<void>;
  pollHoldStatus: () => Promise<void>;

  sendOtp: (mobile: string) => Promise<void>;
  verifyOtp: (code: string) => Promise<void>;
  savePatientDetails: (details: {
    name: string;
    dobOrAge: string;
    gender: Gender;
    email?: string;
  }) => Promise<void>;

  uploadPrescription: (file: File) => Promise<void>;

  loadSummary: () => Promise<void>;
  confirmBooking: (paymentMethod: PaymentMethod) => Promise<void>;
  pay: (forceFail?: boolean) => Promise<void>;
}

const initialDraftState = {
  selectedModality: null,
  selectedCategory: null,
  selectedLabCategory: null,
  selectedLabTestId: null,
  pendingSecondCartToken: null,
  location: null,
  centres: [],
  centresLoading: false,
  pinCheck: null,
  safetyRequired: false,
  preparation: null,
  slotDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
  slots: null,
  slotsLoading: false,
  holdRemainingSeconds: null,
  holdExpired: false,
  holdEverPlaced: false,
  mobile: null,
  devOtp: null,
  resendAvailableInSeconds: 30,
  patientSessionToken: null,
  isExistingPatient: false,
  prefillPatient: null,
  ocrUnmatched: [],
  summary: null,
  bookingId: null,
  bookingCode: null,
  paymentAmount: null,
  paymentFailureReason: null,
  error: null,
  loading: false,
};

export const useWidgetStore = create<WidgetState>()(
  persist(
    (set, get) => ({
      orgSlug: null,
      screen: "HOME",
      history: [],
      cartToken: null,
      cart: null,
      ...initialDraftState,

      init: async (orgSlug) => {
        if (get().orgSlug === orgSlug && get().cartToken) return;
        set({ orgSlug, screen: "HOME", history: [] });
        await get().ensureCart();
      },

      navigate: (screen) =>
        set((s) => ({ screen, history: [...s.history, s.screen], error: null })),
      goBack: () =>
        set((s) => {
          const history = [...s.history];
          const prev = history.pop();
          return { screen: prev ?? "HOME", history };
        }),
      reset: () =>
        set({
          screen: "HOME",
          history: [],
          cartToken: null,
          cart: null,
          ...initialDraftState,
        }),
      setError: (message) => set({ error: message }),

      ensureCart: async () => {
        const existing = get().cartToken;
        if (existing) return existing;
        const orgSlug = get().orgSlug;
        if (!orgSlug) throw new Error("Widget not initialized with an org");
        const cart = await api.createCart(orgSlug);
        set({ cartToken: cart.token, cart });
        return cart.token;
      },

      refreshCart: async () => {
        const token = get().cartToken;
        if (!token) return;
        const cart = await api.getCart(token);
        set({ cart });
      },

      addItem: async (itemType, itemId) => {
        set({ loading: true, error: null });
        try {
          const token = await get().ensureCart();
          const cart = await api.addCartItem(token, itemType, itemId);
          set({ cart, loading: false });
        } catch (err) {
          set({
            loading: false,
            error: err instanceof ApiError ? err.message : "Could not add item",
          });
        }
      },

      removeItem: async (itemId) => {
        const token = get().cartToken;
        if (!token) return;
        const cart = await api.removeCartItem(token, itemId);
        set({ cart });
      },

      setModality: (modality) => set({ selectedModality: modality, selectedCategory: null }),
      setCategory: (category) => set({ selectedCategory: category }),
      setLabCategory: (category) => set({ selectedLabCategory: category }),
      setSelectedLabTest: (id) => set({ selectedLabTestId: id }),

      setLocation: async (loc) => {
        set({ location: loc, error: null });
        await get().loadCentresForCart();
      },

      // Merges two endpoints: /cart/:token/centres (correctness — which centres actually
      // offer everything in the cart) with /orgs/:org/centres/nearby (distance sorting only).
      // Eligibility from the first is never compromised by the second.
      loadCentresForCart: async () => {
        const token = get().cartToken;
        const orgSlug = get().orgSlug;
        if (!token || !orgSlug) return;
        set({ centresLoading: true });
        try {
          const { centres: matching } = await api.centresForCart(token);
          const location = get().location;
          if (location && matching.length > 0) {
            const { centres: nearby } = await api.centresNearby(orgSlug, location);
            const distanceById = new Map(nearby.map((c) => [c.id, c.distanceKm ?? null]));
            const withDistance = matching
              .map((c) => ({ ...c, distanceKm: distanceById.get(c.id) ?? null }))
              .sort((a, b) => {
                if (a.distanceKm == null) return b.distanceKm == null ? 0 : 1;
                if (b.distanceKm == null) return -1;
                return a.distanceKm - b.distanceKm;
              });
            set({ centres: withDistance, centresLoading: false });
            return;
          }
          set({ centres: matching, centresLoading: false });
        } catch {
          set({ centres: [], centresLoading: false });
        }
      },

      selectCentre: async (centreId) => {
        const token = get().cartToken;
        if (!token) return;
        set({ loading: true, error: null });
        try {
          const cart = await api.setCentre(token, centreId);
          set({ cart, loading: false });
          const required = await get().loadSafetyRequired();
          get().navigate(required ? "SAFETY_CHECK" : "PREPARATION_INSTRUCTIONS");
          if (!required) await get().loadPreparation();
        } catch (err) {
          set({
            loading: false,
            error: err instanceof ApiError ? err.message : "Could not select centre",
          });
        }
      },

      // §2.3 empty state recovery: no single centre offers everything, so the combined cart's
      // items are split across two fresh carts. The radiology cart becomes the active one; the
      // lab cart's token is parked and offered once the first booking is confirmed.
      splitIntoTwoBookings: async () => {
        const orgSlug = get().orgSlug;
        const cart = get().cart;
        if (!orgSlug || !cart) return;
        set({ loading: true, error: null });
        try {
          const radiologyCart = await api.createCart(orgSlug);
          const labCart = await api.createCart(orgSlug);
          for (const item of cart.items) {
            if (item.itemType === "RADIOLOGY_EXAM") {
              await api.addCartItem(radiologyCart.token, "RADIOLOGY_EXAM", item.radiologyExamId!);
            } else if (item.itemType === "LAB_TEST") {
              await api.addCartItem(labCart.token, "LAB_TEST", item.labTestId!);
            }
          }
          const refreshedRadiologyCart = await api.getCart(radiologyCart.token);
          set({
            cartToken: radiologyCart.token,
            cart: refreshedRadiologyCart,
            pendingSecondCartToken: labCart.token,
            centres: [],
            location: null,
            loading: false,
          });
          get().navigate("LOCATION");
        } catch (err) {
          set({
            loading: false,
            error: err instanceof ApiError ? err.message : "Could not split the booking",
          });
        }
      },

      continueWithSecondCart: async () => {
        const secondToken = get().pendingSecondCartToken;
        if (!secondToken) return;
        const cart = await api.getCart(secondToken);
        set({
          cartToken: secondToken,
          cart,
          pendingSecondCartToken: null,
          centres: [],
          location: null,
          bookingId: null,
          bookingCode: null,
          summary: null,
          screen: "LOCATION",
          history: [],
        });
      },

      checkPin: async (pinCode) => {
        const token = get().cartToken;
        if (!token) return;
        set({ loading: true });
        const result = await api.checkPin(token, pinCode);
        set({ pinCheck: result, loading: false });
      },

      saveHomeAddress: async (address) => {
        const token = get().cartToken;
        if (!token) return;
        set({ loading: true, error: null });
        try {
          const cart = await api.saveHomeAddress(token, address);
          set({ cart, loading: false });
          await get().loadPreparation();
          get().navigate("PREPARATION_INSTRUCTIONS");
        } catch (err) {
          set({
            loading: false,
            error: err instanceof ApiError ? err.message : "This PIN isn't serviceable yet",
          });
        }
      },

      loadSafetyRequired: async () => {
        const token = get().cartToken;
        if (!token) return false;
        const { safetyCheckRequired } = await api.safetyCheckRequired(token);
        set({ safetyRequired: safetyCheckRequired });
        return safetyCheckRequired;
      },

      submitSafetyCheck: async (answers) => {
        const token = get().cartToken;
        if (!token) return;
        set({ loading: true });
        const { flagged } = await api.submitSafetyCheck(token, answers);
        set({ loading: false });
        if (flagged) {
          get().navigate("SAFETY_CALLBACK_EXIT");
        } else {
          await get().loadPreparation();
          get().navigate("PREPARATION_INSTRUCTIONS");
        }
      },

      loadPreparation: async () => {
        const token = get().cartToken;
        if (!token) return;
        const prep = await api.preparationInstructions(token);
        set({ preparation: prep });
      },

      setSlotDate: (date) => set({ slotDate: date }),

      loadSlots: async (centreId, date) => {
        const token = get().cartToken;
        if (!token) return;
        set({ slotsLoading: true });
        try {
          const slots = await api.slotsForCart(token, centreId, date);
          set({ slots, slotsLoading: false });
        } catch {
          set({ slots: { radiology: [], lab: [] }, slotsLoading: false });
        }
      },

      holdSlot: async (slotId) => {
        const token = get().cartToken;
        if (!token) return;
        set({ loading: true, error: null });
        try {
          await api.holdSlot(token, slotId);
          set({ loading: false, holdEverPlaced: true });
          await get().pollHoldStatus();
        } catch (err) {
          set({
            loading: false,
            error: err instanceof ApiError ? err.message : "Could not hold that slot",
          });
        }
      },

      /**
       * §3.9: an expired hold bounces the patient back to slot selection with a message and
       * they must reselect. Guarded on `holdEverPlaced` — a cart with no hold at all also
       * reports {expired: true} (nothing to count down), which must never be confused with a
       * real lapse, or this would bounce the patient before they've ever picked a time.
       */
      pollHoldStatus: async () => {
        const token = get().cartToken;
        if (!token || !get().holdEverPlaced || get().bookingId) return;
        const status = await api.holdStatus(token);
        set({
          holdExpired: status.expired,
          holdRemainingSeconds: status.expired ? null : (status.remainingSeconds ?? null),
        });
        if (status.expired && get().screen !== "SLOT_SELECTION") {
          get().navigate("SLOT_SELECTION");
          set({ error: "Your slot hold has expired — please reselect a time." });
        }
      },

      sendOtp: async (mobile) => {
        const orgSlug = get().orgSlug;
        if (!orgSlug) return;
        set({ loading: true, error: null });
        try {
          const result = await api.sendOtp(orgSlug, mobile);
          set({
            mobile,
            devOtp: result.devOtp ?? null,
            resendAvailableInSeconds: result.resendAvailableInSeconds,
            loading: false,
          });
        } catch (err) {
          set({
            loading: false,
            error: err instanceof ApiError ? err.message : "Could not send OTP",
          });
        }
      },

      verifyOtp: async (code) => {
        const orgSlug = get().orgSlug;
        const mobile = get().mobile;
        const token = get().cartToken;
        if (!orgSlug || !mobile) return;
        set({ loading: true, error: null });
        try {
          const result = await api.verifyOtp(orgSlug, mobile, code, token ?? undefined);
          set({
            patientSessionToken: result.sessionToken,
            isExistingPatient: result.isExistingPatient,
            prefillPatient: result.patient,
            loading: false,
          });
          await get().refreshCart();
          get().navigate("PATIENT_DETAILS");
        } catch (err) {
          set({
            loading: false,
            error: err instanceof ApiError ? err.message : "Incorrect OTP — please try again",
          });
        }
      },

      savePatientDetails: async (details) => {
        const sessionToken = get().patientSessionToken;
        if (!sessionToken) return;
        set({ loading: true, error: null });
        try {
          await api.savePatientDetails(sessionToken, details);
          set({ loading: false });
          await get().loadSummary();
          get().navigate("BOOKING_SUMMARY");
        } catch (err) {
          set({
            loading: false,
            error: err instanceof ApiError ? err.message : "Could not save details",
          });
        }
      },

      uploadPrescription: async (file) => {
        const orgSlug = get().orgSlug;
        set({ loading: true, error: null });
        try {
          const token = await get().ensureCart();
          if (!orgSlug) return;
          get().navigate("OCR_PROCESSING");
          const result = await api.uploadPrescription(orgSlug, token, file);
          if (result.totalFailure) {
            set({ loading: false, ocrUnmatched: result.unmatched });
            get().navigate("OCR_FAILURE");
            return;
          }
          set({ cart: result.cart, ocrUnmatched: result.unmatched, loading: false });
          const cartType = result.cart.cartType;
          get().navigate(
            cartType === "COMBINED"
              ? "COMBINED_CART"
              : cartType === "LAB"
                ? "LAB_CART"
                : "RADIOLOGY_CART",
          );
        } catch (err) {
          set({ loading: false, error: err instanceof ApiError ? err.message : "Upload failed" });
          get().navigate("OCR_FAILURE");
        }
      },

      loadSummary: async () => {
        const token = get().cartToken;
        if (!token) return;
        const summary = await api.summary(token);
        set({ summary });
      },

      confirmBooking: async (paymentMethod) => {
        const token = get().cartToken;
        if (!token) return;
        set({ loading: true, error: null });
        try {
          const result = await api.confirm(token, paymentMethod);
          set({
            bookingId: result.bookingId,
            bookingCode: result.bookingCode,
            paymentAmount: result.paymentIntent?.amount ?? result.totalAmount,
            loading: false,
          });
          get().navigate(result.status === "CONFIRMED" ? "CONFIRMATION" : "PAYMENT");
        } catch (err) {
          set({
            loading: false,
            error: err instanceof ApiError ? err.message : "Could not confirm booking",
          });
        }
      },

      pay: async (forceFail) => {
        const bookingId = get().bookingId;
        if (!bookingId) return;
        set({ loading: true, error: null, paymentFailureReason: null });
        try {
          const result = await api.payForBooking(bookingId, forceFail);
          set({ loading: false });
          if (result.success) {
            get().navigate("CONFIRMATION");
          } else {
            set({ paymentFailureReason: result.failureReason ?? "Payment failed" });
          }
        } catch (err) {
          set({
            loading: false,
            paymentFailureReason: err instanceof ApiError ? err.message : "Payment failed",
          });
        }
      },
    }),
    {
      name: "rlap-widget",
      partialize: (s) => ({
        orgSlug: s.orgSlug,
        cartToken: s.cartToken,
        patientSessionToken: s.patientSessionToken,
        pendingSecondCartToken: s.pendingSecondCartToken,
        bookingId: s.bookingId,
        bookingCode: s.bookingCode,
      }),
    },
  ),
);
