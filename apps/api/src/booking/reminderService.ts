import { prisma } from "@rlap/db";
import { notificationProvider } from "../integrations/notifications";

const REMINDER_WINDOW_HOURS = 24;

function dateOnly(daysFromToday: number): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysFromToday),
  );
}

/** Combines a Slot's date-only and time-only columns (both anchored at different epoch dates
 * in storage — see packages/db seed/hold code) into the actual appointment instant. */
function slotMoment(date: Date, time: Date): number {
  return Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    time.getUTCHours(),
    time.getUTCMinutes(),
    time.getUTCSeconds(),
  );
}

/**
 * §5.8: "reminder notifications are configurable per organization" — sends one reminder per
 * CONFIRMED booking whose soonest appointment leg falls within the next 24h, respecting the
 * org's `remindersEnabled` toggle. `reminderSentAt` is the dedup marker so a booking is never
 * reminded twice even across overlapping sweep runs.
 */
export async function sendDueReminders(): Promise<number> {
  const now = Date.now();
  const windowEnd = now + REMINDER_WINDOW_HOURS * 60 * 60 * 1000;

  const candidates = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      reminderSentAt: null,
      organization: { remindersEnabled: true },
      bookingSlots: {
        some: { slot: { date: { gte: dateOnly(0), lte: dateOnly(2) } } },
      },
    },
    include: {
      patient: true,
      centre: true,
      bookingSlots: { include: { slot: true } },
    },
  });

  let sent = 0;
  for (const booking of candidates) {
    const soonestMoment = Math.min(
      ...booking.bookingSlots.map((bs) => slotMoment(bs.slot.date, bs.slot.startTime)),
    );
    if (soonestMoment < now || soonestMoment > windowEnd) continue;

    const message = `Reminder: your RLAP booking ${booking.bookingCode} at ${booking.centre.name} is coming up soon.`;
    await notificationProvider.send({
      bookingId: booking.id,
      channel: "SMS",
      to: booking.patient.mobileNumber,
      body: message,
    });
    await prisma.booking.update({
      where: { id: booking.id },
      data: { reminderSentAt: new Date() },
    });
    sent += 1;
  }
  return sent;
}
