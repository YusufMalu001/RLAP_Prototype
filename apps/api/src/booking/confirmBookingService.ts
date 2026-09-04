import { randomBytes } from "crypto";
import { prisma } from "@rlap/db";
import type { BookingStatus, CollectionMode, PaymentMethod, SlotType } from "@rlap/db";
import { CartError, computeCartType, getCart, isCartFlagged } from "../cart/cartService";
import { computePayAtReceptionEligibility } from "../cart/bookingSummaryService";
import { cartStore } from "../cart/store";
import { isSafetyCheckRequired } from "../cart/safetyCheckService";
import { SAFETY_CHECK_QUESTIONS } from "../cart/types";
import type { Cart, CartType } from "../cart/types";
import { sendBookingNotifications } from "./bookingService";

// Avoids visually ambiguous characters (0/O, 1/I/L) — matches the "RLAP-A1B2C3" style example
// from the widget spec (§4.2 SC8).
const BOOKING_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateBookingCodeCandidate(): string {
  const bytes = randomBytes(6);
  let suffix = "";
  for (const byte of bytes) {
    suffix += BOOKING_CODE_ALPHABET[byte % BOOKING_CODE_ALPHABET.length];
  }
  return `RLAP-${suffix}`;
}

async function generateUniqueBookingCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateBookingCodeCandidate();
    const existing = await prisma.booking.findUnique({ where: { bookingCode: candidate } });
    if (!existing) return candidate;
  }
  throw new Error("Could not generate a unique booking code after 5 attempts");
}

function requiredSlotTypesForCart(cart: Cart, cartType: CartType): SlotType[] {
  if (cartType === "RADIOLOGY") return ["RADIOLOGY"];
  if (cartType === "LAB")
    return [cart.collectionMode === "HOME_COLLECTION" ? "HOME_COLLECTION_WINDOW" : "LAB"];
  if (cartType === "COMBINED") return ["RADIOLOGY", "LAB"]; // always centre-visit (§2.3)
  return [];
}

/** Radiology-only -> null; Combined is always centre-visit (§2.3); Lab defaults to centre-visit. */
function resolveBookingCollectionMode(cart: Cart, cartType: CartType): CollectionMode | null {
  if (cartType === "COMBINED") return "CENTRE_VISIT";
  if (cartType === "LAB") return cart.collectionMode ?? "CENTRE_VISIT";
  return null;
}

export interface ConfirmBookingInput {
  paymentMethod: PaymentMethod;
}

export interface ConfirmBookingResult {
  bookingId: string;
  bookingCode: string;
  status: BookingStatus;
  totalAmount: number;
  paymentIntent?: { bookingId: string; amount: number };
}

/**
 * §5.4/§5.5: exactly one Booking row per cart, created atomically with its line items and
 * slot(s). The cart is deleted from the store on success — a second /confirm call on the
 * same token 404s instead of risking a duplicate booking from a double-submit.
 */
export async function confirmBooking(
  token: string,
  input: ConfirmBookingInput,
): Promise<ConfirmBookingResult> {
  const cart = getCart(token);
  const cartType = computeCartType(cart.items);
  if (cartType === null) throw new CartError(400, "Cart is empty");

  if (!cart.patientId) {
    throw new CartError(400, "Patient must be identified (OTP verified) before confirming");
  }
  if (!cart.centreId) {
    throw new CartError(400, "A centre must be selected before confirming");
  }
  const centre = await prisma.centre.findUnique({ where: { id: cart.centreId } });
  if (!centre) throw new CartError(400, "Selected centre no longer exists");

  if (await isSafetyCheckRequired(token)) {
    if (!cart.safetyCheckAnswers) {
      throw new CartError(400, "Safety check must be completed before confirming");
    }
    if (isCartFlagged(cart.safetyCheckAnswers)) {
      throw new CartError(
        409,
        "This booking is blocked pending a callback — flagged by the safety check",
      );
    }
  }

  const requiredSlotTypes = requiredSlotTypesForCart(cart, cartType);
  const activeHolds = await prisma.slotHold.findMany({
    where: { cartToken: token, expiresAt: { gt: new Date() } },
    include: { slot: true },
  });
  const holdBySlotType = new Map(activeHolds.map((hold) => [hold.slot.type, hold]));
  for (const slotType of requiredSlotTypes) {
    if (!holdBySlotType.has(slotType)) {
      throw new CartError(409, "Your slot hold has expired — please reselect a time");
    }
  }

  if (input.paymentMethod === "PAY_AT_RECEPTION") {
    const eligible = await computePayAtReceptionEligibility(cart);
    if (!eligible) {
      throw new CartError(400, "Pay at reception is not available for this booking");
    }
  }

  const bookingCode = await generateUniqueBookingCode();
  const status: BookingStatus =
    input.paymentMethod === "PAY_AT_RECEPTION" ? "CONFIRMED" : "PENDING_PAYMENT";
  const totalAmount = cart.items.reduce((sum, item) => sum + item.price, 0);
  const collectionMode = resolveBookingCollectionMode(cart, cartType);
  const lineItems = cart.items.filter((item) => item.itemType !== "HOME_COLLECTION_CHARGE");
  const safetyAnswers = cart.safetyCheckAnswers;

  const booking = await prisma.$transaction(async (tx) => {
    const created = await tx.booking.create({
      data: {
        bookingCode,
        organizationId: cart.organizationId,
        patientId: cart.patientId!,
        centreId: cart.centreId!,
        type: cartType,
        status,
        paymentMethod: input.paymentMethod,
        collectionMode,
        totalAmount,
      },
    });

    for (const item of lineItems) {
      await tx.bookingLineItem.create({
        data: {
          bookingId: created.id,
          itemType: item.itemType === "RADIOLOGY_EXAM" ? "RADIOLOGY_EXAM" : "LAB_TEST",
          radiologyExamId: item.radiologyExamId,
          labTestId: item.labTestId,
          priceAtBooking: item.price,
          source: item.source,
          ocrConfidence: item.ocrConfidence,
        },
      });
    }

    for (const hold of activeHolds) {
      await tx.bookingSlot.create({
        data: { bookingId: created.id, slotId: hold.slotId, slotType: hold.slot.type },
      });
      await tx.slot.update({ where: { id: hold.slotId }, data: { bookedCount: { increment: 1 } } });
    }
    await tx.slotHold.deleteMany({ where: { cartToken: token } });

    if (safetyAnswers) {
      for (const key of SAFETY_CHECK_QUESTIONS) {
        await tx.safetyCheckResponse.create({
          data: {
            bookingId: created.id,
            questionKey: key,
            answer: String(safetyAnswers[key]),
            flagged: safetyAnswers[key] === true,
          },
        });
      }
    }

    return created;
  });

  cartStore.delete(token);

  if (status === "CONFIRMED") {
    await sendBookingNotifications(booking.id);
  }

  return {
    bookingId: booking.id,
    bookingCode: booking.bookingCode,
    status: booking.status,
    totalAmount,
    paymentIntent:
      status === "PENDING_PAYMENT" ? { bookingId: booking.id, amount: totalAmount } : undefined,
  };
}
