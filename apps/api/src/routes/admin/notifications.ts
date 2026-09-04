import { Router } from "express";
import { prisma } from "@rlap/db";
import type { NotificationChannel } from "@rlap/db";
import { asyncHandler } from "../../lib/asyncHandler";
import { HttpError } from "../../lib/httpError";

export const adminNotificationsRouter = Router();

const CHANNELS = new Set<NotificationChannel>(["SMS", "EMAIL", "WHATSAPP"]);

// Read-only — this is the only place "what did we actually send" is visible, since the
// mock notification provider only ever writes SentNotification rows, never a real send.
adminNotificationsRouter.get(
  "/notifications",
  asyncHandler(async (req, res) => {
    const organizationId = req.adminUser!.organizationId;
    const bookingId = typeof req.query.bookingId === "string" ? req.query.bookingId : undefined;
    const channel =
      typeof req.query.channel === "string"
        ? (req.query.channel as NotificationChannel)
        : undefined;
    const page = Math.max(Number(req.query.page ?? 1), 1);
    const pageSize = 50;

    if (channel && !CHANNELS.has(channel)) {
      throw new HttpError(400, `Invalid channel "${channel}"`);
    }
    if (bookingId) {
      const owned = await prisma.booking.findFirst({ where: { id: bookingId, organizationId } });
      if (!owned) throw new HttpError(404, "Booking not found");
    }

    const where = {
      booking: { organizationId },
      ...(bookingId ? { bookingId } : {}),
      ...(channel ? { channel } : {}),
    };

    const [total, notifications] = await Promise.all([
      prisma.sentNotification.count({ where }),
      prisma.sentNotification.findMany({
        where,
        include: { booking: { select: { bookingCode: true } } },
        orderBy: { sentAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    res.json({
      total,
      page,
      pageSize,
      notifications: notifications.map((n) => ({
        id: n.id,
        bookingId: n.bookingId,
        bookingCode: n.booking.bookingCode,
        channel: n.channel,
        to: n.to,
        subject: n.subject,
        body: n.body,
        sentAt: n.sentAt.toISOString(),
      })),
    });
  }),
);
