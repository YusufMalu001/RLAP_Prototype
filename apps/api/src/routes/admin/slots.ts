import { Router } from "express";
import { prisma } from "@rlap/db";
import type { SlotType } from "@rlap/db";
import { asyncHandler } from "../../lib/asyncHandler";
import { HttpError } from "../../lib/httpError";

export const adminSlotsRouter = Router();

const SLOT_TYPES = new Set<SlotType>(["RADIOLOGY", "LAB", "HOME_COLLECTION_WINDOW"]);

function dateOnly(daysFromToday: number): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysFromToday),
  );
}

function timeOnly(hour: number, minute: number): Date {
  return new Date(Date.UTC(1970, 0, 1, hour, minute));
}

async function requireOwnedCentre(centreId: string, organizationId: string) {
  const centre = await prisma.centre.findFirst({ where: { id: centreId, organizationId } });
  if (!centre) throw new HttpError(404, "Centre not found");
  return centre;
}

// View: capacity per day for the next N days, grouped for a simple calendar-style table —
// no phlebotomist/machine-level modelling, exactly as the spec flags this as a future item.
adminSlotsRouter.get(
  "/centres/:centreId/slots",
  asyncHandler(async (req, res) => {
    const centre = await requireOwnedCentre(req.params.centreId!, req.adminUser!.organizationId);
    const days = Math.min(Math.max(Number(req.query.days ?? 14), 1), 60);
    const from = dateOnly(0);
    const to = dateOnly(days);

    const slots = await prisma.slot.findMany({
      where: { centreId: centre.id, date: { gte: from, lt: to } },
      orderBy: [{ date: "asc" }, { type: "asc" }, { startTime: "asc" }],
    });

    const byDate = new Map<string, typeof slots>();
    for (const slot of slots) {
      const key = slot.date.toISOString().slice(0, 10);
      const bucket = byDate.get(key);
      if (bucket) bucket.push(slot);
      else byDate.set(key, [slot]);
    }

    const daysOut = [...byDate.entries()].map(([date, daySlots]) => ({
      date,
      slots: daySlots.map((s) => ({
        id: s.id,
        type: s.type,
        startTime: s.startTime.toISOString().slice(11, 16),
        endTime: s.endTime.toISOString().slice(11, 16),
        capacity: s.capacity,
        bookedCount: s.bookedCount,
      })),
    }));

    res.json({ centreId: centre.id, days: daysOut });
  }),
);

export interface GenerateSlotsInput {
  type: SlotType;
  days: number;
  startHour: number;
  endHour: number;
  slotsPerHour: number;
  capacityPerSlot: number;
}

/** Bulk-generates a fixed slot grid — "N days, X per hour" is deliberately the entire
 * capacity model here; real phlebotomist/machine capacity math is an explicit future item
 * (§7.2). Safe to re-run: (centreId, type, date, startTime) is unique, so createMany with
 * skipDuplicates just fills in whatever's missing rather than erroring or doubling up. */
export function buildSlotRows(centreId: string, input: GenerateSlotsInput) {
  const minutesPerSlot = Math.round(60 / input.slotsPerHour);
  const rows: Array<{
    centreId: string;
    type: SlotType;
    date: Date;
    startTime: Date;
    endTime: Date;
    capacity: number;
  }> = [];

  for (let day = 0; day < input.days; day++) {
    const date = dateOnly(day);
    for (
      let minutes = input.startHour * 60;
      minutes < input.endHour * 60;
      minutes += minutesPerSlot
    ) {
      const startHour = Math.floor(minutes / 60);
      const startMinute = minutes % 60;
      const endMinutes = minutes + minutesPerSlot;
      const endHour = Math.floor(endMinutes / 60);
      const endMinute = endMinutes % 60;
      rows.push({
        centreId,
        type: input.type,
        date,
        startTime: timeOnly(startHour, startMinute),
        endTime: timeOnly(endHour, endMinute),
        capacity: input.capacityPerSlot,
      });
    }
  }
  return rows;
}

adminSlotsRouter.post(
  "/centres/:centreId/slots/generate",
  asyncHandler(async (req, res) => {
    const centre = await requireOwnedCentre(req.params.centreId!, req.adminUser!.organizationId);

    const b = req.body ?? {};
    if (!SLOT_TYPES.has(b.type)) {
      throw new HttpError(400, `type must be one of ${[...SLOT_TYPES].join(", ")}`);
    }
    const input: GenerateSlotsInput = {
      type: b.type,
      days: Number(b.days ?? 14),
      startHour: Number(b.startHour ?? 9),
      endHour: Number(b.endHour ?? 18),
      slotsPerHour: Number(b.slotsPerHour ?? 2),
      capacityPerSlot: Number(b.capacityPerSlot ?? 3),
    };
    if (
      !(input.days > 0 && input.days <= 90) ||
      !(input.startHour >= 0 && input.startHour < 24) ||
      !(input.endHour > input.startHour && input.endHour <= 24) ||
      !(input.slotsPerHour > 0 && input.slotsPerHour <= 12) ||
      !(input.capacityPerSlot > 0 && input.capacityPerSlot <= 1000)
    ) {
      throw new HttpError(400, "Invalid slot-generation parameters");
    }

    const rows = buildSlotRows(centre.id, input);
    const result = await prisma.slot.createMany({ data: rows, skipDuplicates: true });
    res.status(201).json({ requested: rows.length, created: result.count });
  }),
);

adminSlotsRouter.delete(
  "/slots/:id",
  asyncHandler(async (req, res) => {
    const organizationId = req.adminUser!.organizationId;
    const slot = await prisma.slot.findFirst({
      where: { id: req.params.id, centre: { organizationId } },
    });
    if (!slot) throw new HttpError(404, "Slot not found");
    if (slot.bookedCount > 0) {
      throw new HttpError(409, "Cannot delete — this slot has existing bookings");
    }
    await prisma.slot.delete({ where: { id: slot.id } });
    res.status(204).end();
  }),
);
