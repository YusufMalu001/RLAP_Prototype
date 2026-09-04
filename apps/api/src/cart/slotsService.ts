import { prisma } from "@rlap/db";
import type { Slot, SlotType } from "@rlap/db";
import { CartError, computeCartType, getCart } from "./cartService";

export interface SlotSummary {
  id: string;
  type: SlotType;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  availableCapacity: number;
}

export interface SlotsForCart {
  radiology: SlotSummary[];
  lab: SlotSummary[];
}

function toDateOnly(dateString: string): Date {
  return new Date(`${dateString}T00:00:00.000Z`);
}

function toHHMM(time: Date): string {
  return time.toISOString().slice(11, 16);
}

async function attachAvailability(slots: Slot[]): Promise<SlotSummary[]> {
  if (slots.length === 0) return [];

  const slotIds = slots.map((slot) => slot.id);
  const activeHolds = await prisma.slotHold.groupBy({
    by: ["slotId"],
    where: { slotId: { in: slotIds }, expiresAt: { gt: new Date() } },
    _count: { slotId: true },
  });
  const heldCountBySlot = new Map(activeHolds.map((row) => [row.slotId, row._count.slotId]));

  return slots.map((slot) => {
    const held = heldCountBySlot.get(slot.id) ?? 0;
    return {
      id: slot.id,
      type: slot.type,
      date: slot.date.toISOString().slice(0, 10),
      startTime: toHHMM(slot.startTime),
      endTime: toHHMM(slot.endTime),
      capacity: slot.capacity,
      availableCapacity: Math.max(0, slot.capacity - slot.bookedCount - held),
    };
  });
}

/**
 * §4.2 R9/L7/C5: single list for Radiology/Lab-only, two independent lists for Combined.
 * A LAB cart on the Home Collection path (§3.3) is shown HOME_COLLECTION_WINDOW slots
 * instead of centre LAB slots — still returned under the `lab` key.
 */
export async function getSlotsForCart(
  token: string,
  centreId: string,
  date: string,
): Promise<SlotsForCart> {
  const cart = getCart(token);
  const cartType = computeCartType(cart.items);
  if (cartType === null) return { radiology: [], lab: [] };

  const centre = await prisma.centre.findUnique({ where: { id: centreId } });
  if (!centre || centre.organizationId !== cart.organizationId) {
    throw new CartError(400, "Centre does not belong to this cart's organization");
  }

  const wantRadiology = cartType === "RADIOLOGY" || cartType === "COMBINED";
  const wantLab = cartType === "LAB" || cartType === "COMBINED";
  const labSlotType: SlotType =
    cart.collectionMode === "HOME_COLLECTION" ? "HOME_COLLECTION_WINDOW" : "LAB";

  const types: SlotType[] = [
    ...(wantRadiology ? (["RADIOLOGY"] as SlotType[]) : []),
    ...(wantLab ? [labSlotType] : []),
  ];
  if (types.length === 0) return { radiology: [], lab: [] };

  const slots = await prisma.slot.findMany({
    where: { centreId, date: toDateOnly(date), type: { in: types } },
    orderBy: { startTime: "asc" },
  });
  const summaries = await attachAvailability(slots);

  return {
    radiology: summaries.filter((slot) => slot.type === "RADIOLOGY"),
    lab: summaries.filter((slot) => slot.type === labSlotType),
  };
}
