import { Router } from "express";
import { prisma } from "@rlap/db";
import type { BookingStatus } from "@rlap/db";
import { asyncHandler } from "../../lib/asyncHandler";

export const adminDashboardRouter = Router();

function dateOnly(daysFromToday: number): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysFromToday),
  );
}

function summarizeBooking(booking: {
  id: string;
  bookingCode: string;
  status: BookingStatus;
  type: string;
  totalAmount: unknown;
  createdAt: Date;
  patient: { name: string | null; mobileNumber: string };
  centre: { id: string; name: string };
  bookingSlots: Array<{ slotType: string; slot: { date: Date; startTime: Date } }>;
}) {
  const soonestSlot = [...booking.bookingSlots].sort(
    (a, b) => a.slot.date.getTime() - b.slot.date.getTime(),
  )[0];
  return {
    id: booking.id,
    bookingCode: booking.bookingCode,
    status: booking.status,
    type: booking.type,
    totalAmount: Number(booking.totalAmount),
    patientName: booking.patient.name,
    patientMobile: booking.patient.mobileNumber,
    centre: booking.centre,
    scheduledDate: soonestSlot ? soonestSlot.slot.date.toISOString().slice(0, 10) : null,
    scheduledTime: soonestSlot ? soonestSlot.slot.startTime.toISOString().slice(11, 16) : null,
    createdAt: booking.createdAt.toISOString(),
  };
}

// Today's count + an upcoming list, quick-filterable by centre/status — the two things an
// admin opening the dashboard actually wants to see at a glance.
adminDashboardRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const organizationId = req.adminUser!.organizationId;
    const centreId = typeof req.query.centreId === "string" ? req.query.centreId : undefined;
    const status =
      typeof req.query.status === "string" ? (req.query.status as BookingStatus) : undefined;

    const todayStart = dateOnly(0);
    const todayEnd = dateOnly(1);

    const [todayBookingsCount, upcomingRaw, centres] = await Promise.all([
      prisma.booking.count({
        where: {
          organizationId,
          status: { not: "CANCELLED" },
          bookingSlots: { some: { slot: { date: { gte: todayStart, lt: todayEnd } } } },
        },
      }),
      prisma.booking.findMany({
        where: {
          organizationId,
          ...(centreId ? { centreId } : {}),
          ...(status ? { status } : { status: { not: "CANCELLED" } }),
          bookingSlots: { some: { slot: { date: { gte: todayStart } } } },
        },
        include: {
          patient: true,
          centre: { select: { id: true, name: true } },
          bookingSlots: { include: { slot: true } },
        },
        take: 50,
        orderBy: { createdAt: "desc" },
      }),
      prisma.centre.findMany({
        where: { organizationId },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

    const upcomingBookings = upcomingRaw
      .map(summarizeBooking)
      .sort((a, b) => (a.scheduledDate ?? "").localeCompare(b.scheduledDate ?? ""));

    res.json({ todayBookingsCount, upcomingBookings, centres });
  }),
);
