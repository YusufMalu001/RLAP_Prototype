import { prisma } from "@rlap/db";
import { HttpError } from "../lib/httpError";
import { notificationProvider } from "../integrations/notifications";
import { paymentProvider } from "../integrations/payment";

export class BookingError extends HttpError {}

/** §5.8: SMS always sent; email/WhatsApp gated by the org's own notification toggles. */
export async function sendBookingNotifications(bookingId: string): Promise<void> {
  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { patient: true, organization: true, centre: true },
  });

  const message = `Your RLAP booking ${booking.bookingCode} at ${booking.centre.name} is confirmed.`;

  await notificationProvider.send({
    bookingId,
    channel: "SMS",
    to: booking.patient.mobileNumber,
    body: message,
  });

  if (booking.organization.emailNotificationsEnabled && booking.patient.email) {
    await notificationProvider.send({
      bookingId,
      channel: "EMAIL",
      to: booking.patient.email,
      subject: "Your RLAP booking is confirmed",
      body: message,
    });
  }

  if (booking.organization.whatsappNotificationsEnabled) {
    await notificationProvider.send({
      bookingId,
      channel: "WHATSAPP",
      to: booking.patient.mobileNumber,
      body: message,
    });
  }
}

export interface PayResult {
  success: boolean;
  status: string;
  bookingCode?: string;
  failureReason?: string;
}

/** §5.8: payment failure returns the patient to the payment step — the booking is never dropped. */
export async function payForBooking(
  bookingId: string,
  options: { forceFail?: boolean } = {},
): Promise<PayResult> {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new BookingError(404, "Booking not found");
  if (booking.status !== "PENDING_PAYMENT") {
    throw new BookingError(409, `Booking is not awaiting payment (status: ${booking.status})`);
  }

  const result = await paymentProvider.charge({
    amount: Number(booking.totalAmount),
    forceFail: options.forceFail,
  });

  if (!result.success) {
    return { success: false, status: booking.status, failureReason: result.failureReason };
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CONFIRMED" },
  });
  await sendBookingNotifications(bookingId);

  return { success: true, status: updated.status, bookingCode: updated.bookingCode };
}

export async function getBookingDetail(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      centre: true,
      patient: true,
      lineItems: { include: { radiologyExam: true, labTest: true } },
      bookingSlots: { include: { slot: true } },
      safetyCheckResponses: true,
    },
  });
  if (!booking) throw new BookingError(404, "Booking not found");

  return {
    id: booking.id,
    bookingCode: booking.bookingCode,
    status: booking.status,
    type: booking.type,
    paymentMethod: booking.paymentMethod,
    collectionMode: booking.collectionMode,
    totalAmount: Number(booking.totalAmount),
    centre: { id: booking.centre.id, name: booking.centre.name, address: booking.centre.address },
    patient: { name: booking.patient.name, mobileNumber: booking.patient.mobileNumber },
    lineItems: booking.lineItems.map((item) => ({
      id: item.id,
      itemType: item.itemType,
      name: item.radiologyExam?.name ?? item.labTest?.name ?? "",
      price: Number(item.priceAtBooking),
      source: item.source,
      ocrConfidence: item.ocrConfidence,
      preparationInstructions:
        item.radiologyExam?.preparationInstructions ??
        item.labTest?.preparationInstructions ??
        null,
    })),
    schedule: booking.bookingSlots.map((bookingSlot) => ({
      type: bookingSlot.slotType,
      date: bookingSlot.slot.date.toISOString().slice(0, 10),
      startTime: bookingSlot.slot.startTime.toISOString().slice(11, 16),
      endTime: bookingSlot.slot.endTime.toISOString().slice(11, 16),
    })),
    safetyCheck: booking.safetyCheckResponses.map((response) => ({
      questionKey: response.questionKey,
      answer: response.answer,
      flagged: response.flagged,
    })),
    createdAt: booking.createdAt.toISOString(),
  };
}

/**
 * Manual stand-in for real LIS/RIS-driven completion (out of scope per the spec — §7.2).
 * Only reachable via /api/admin/bookings/:id/complete, behind admin session auth — see
 * apps/api/src/admin/adminAuthMiddleware.ts.
 */
export async function markBookingCompleted(bookingId: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new BookingError(404, "Booking not found");
  if (booking.status !== "CONFIRMED") {
    throw new BookingError(
      409,
      `Only a CONFIRMED booking can be marked COMPLETED (status: ${booking.status})`,
    );
  }
  return prisma.booking.update({ where: { id: bookingId }, data: { status: "COMPLETED" } });
}
