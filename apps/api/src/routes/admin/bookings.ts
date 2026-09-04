import { Router } from "express";
import { prisma } from "@rlap/db";
import type { BookingStatus } from "@rlap/db";
import { asyncHandler } from "../../lib/asyncHandler";
import { HttpError } from "../../lib/httpError";
import { getBookingDetail, markBookingCompleted } from "../../booking/bookingService";

export const adminBookingsRouter = Router();

const BOOKING_STATUSES = new Set<BookingStatus>([
  "PENDING_PAYMENT",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
]);

async function requireOwnedBooking(bookingId: string, organizationId: string) {
  const booking = await prisma.booking.findFirst({ where: { id: bookingId, organizationId } });
  if (!booking) throw new HttpError(404, "Booking not found");
  return booking;
}

adminBookingsRouter.get(
  "/bookings",
  asyncHandler(async (req, res) => {
    const organizationId = req.adminUser!.organizationId;
    const status =
      typeof req.query.status === "string" ? (req.query.status as BookingStatus) : undefined;
    const centreId = typeof req.query.centreId === "string" ? req.query.centreId : undefined;
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const page = Math.max(Number(req.query.page ?? 1), 1);
    const pageSize = 25;

    if (status && !BOOKING_STATUSES.has(status)) {
      throw new HttpError(400, `Invalid status "${status}"`);
    }

    const where = {
      organizationId,
      ...(status ? { status } : {}),
      ...(centreId ? { centreId } : {}),
      ...(q
        ? {
            OR: [
              { bookingCode: { contains: q, mode: "insensitive" as const } },
              { patient: { name: { contains: q, mode: "insensitive" as const } } },
              { patient: { mobileNumber: { contains: q } } },
            ],
          }
        : {}),
    };

    const [total, bookings] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        include: { patient: true, centre: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    res.json({
      total,
      page,
      pageSize,
      bookings: bookings.map((b) => ({
        id: b.id,
        bookingCode: b.bookingCode,
        status: b.status,
        type: b.type,
        totalAmount: Number(b.totalAmount),
        patientName: b.patient.name,
        patientMobile: b.patient.mobileNumber,
        centre: b.centre,
        createdAt: b.createdAt.toISOString(),
      })),
    });
  }),
);

adminBookingsRouter.get(
  "/bookings/:id",
  asyncHandler(async (req, res) => {
    await requireOwnedBooking(req.params.id!, req.adminUser!.organizationId);
    res.json(await getBookingDetail(req.params.id!));
  }),
);

// Manual completion is the intended, documented stand-in for real LIS/RIS sync (§7.2) —
// this is what unlocks report download for the patient (§5.7), now properly admin-gated.
adminBookingsRouter.post(
  "/bookings/:id/complete",
  asyncHandler(async (req, res) => {
    await requireOwnedBooking(req.params.id!, req.adminUser!.organizationId);
    res.json(await markBookingCompleted(req.params.id!));
  }),
);
