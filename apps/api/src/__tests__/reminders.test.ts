import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@rlap/db";
import { sendDueReminders } from "../booking/reminderService";
import { cleanupOrg, createBooking, createCentre, createTestOrg } from "./helpers";

// Slot.date/startTime storage convention matches seed.ts / slotHoldService.ts: date is a
// UTC-midnight-anchored calendar day, startTime is anchored at 1970-01-01.
function timeAt(hoursFromNow: number): Date {
  const target = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
  return new Date(Date.UTC(1970, 0, 1, target.getUTCHours(), target.getUTCMinutes()));
}

function dateFor(hoursFromNow: number): Date {
  const target = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
  return new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate()));
}

async function bookingWithSlotIn(
  organizationId: string,
  centreId: string,
  hoursFromNow: number,
  overrides: Partial<{ status: "PENDING_PAYMENT" | "CONFIRMED" | "COMPLETED" | "CANCELLED" }> = {},
) {
  const slot = await prisma.slot.create({
    data: {
      centreId,
      type: "RADIOLOGY",
      date: dateFor(hoursFromNow),
      startTime: timeAt(hoursFromNow),
      endTime: timeAt(hoursFromNow + 1),
      capacity: 1,
      bookedCount: 1,
    },
  });
  const booking = await createBooking(organizationId, centreId, {
    status: overrides.status ?? "CONFIRMED",
  });
  await prisma.bookingSlot.create({
    data: { bookingId: booking.id, slotId: slot.id, slotType: "RADIOLOGY" },
  });
  return booking;
}

describe("reminder notifications (§5.8)", () => {
  let orgId: string;
  let centreId: string;

  beforeAll(async () => {
    const org = await createTestOrg("reminders");
    orgId = org.id;
    centreId = (await createCentre(orgId)).id;
  });

  afterAll(async () => cleanupOrg(orgId));

  it("sends a reminder for a CONFIRMED booking within the next 24h and marks it sent", async () => {
    const booking = await bookingWithSlotIn(orgId, centreId, 2);

    const sentCount = await sendDueReminders();
    expect(sentCount).toBeGreaterThanOrEqual(1);

    const updated = await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } });
    expect(updated.reminderSentAt).not.toBeNull();

    const notifications = await prisma.sentNotification.findMany({
      where: { bookingId: booking.id },
    });
    expect(notifications).toHaveLength(1);
    expect(notifications[0]!.channel).toBe("SMS");
  });

  it("never sends a second reminder for the same booking (dedup via reminderSentAt)", async () => {
    const booking = await bookingWithSlotIn(orgId, centreId, 3);

    await sendDueReminders();
    const firstNotifications = await prisma.sentNotification.count({
      where: { bookingId: booking.id },
    });
    expect(firstNotifications).toBe(1);

    await sendDueReminders();
    const secondNotifications = await prisma.sentNotification.count({
      where: { bookingId: booking.id },
    });
    expect(secondNotifications).toBe(1);
  });

  it("does not remind for an appointment more than 24h away", async () => {
    const booking = await bookingWithSlotIn(orgId, centreId, 72);

    await sendDueReminders();
    const updated = await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } });
    expect(updated.reminderSentAt).toBeNull();
  });

  it("does not remind for a PENDING_PAYMENT booking", async () => {
    const booking = await bookingWithSlotIn(orgId, centreId, 4, { status: "PENDING_PAYMENT" });

    await sendDueReminders();
    const updated = await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } });
    expect(updated.reminderSentAt).toBeNull();
  });

  it("respects the organization's remindersEnabled toggle", async () => {
    await prisma.organization.update({ where: { id: orgId }, data: { remindersEnabled: false } });
    const booking = await bookingWithSlotIn(orgId, centreId, 5);

    await sendDueReminders();
    const updated = await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } });
    expect(updated.reminderSentAt).toBeNull();

    await prisma.organization.update({ where: { id: orgId }, data: { remindersEnabled: true } });
  });
});
