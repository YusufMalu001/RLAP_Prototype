import { prisma } from "@rlap/db";
import { getCart } from "./cartService";
import type { Cart } from "./types";

/**
 * §5.5/§3.9 mixed-cart rule: pay-at-reception requires the org to allow it AND every single
 * line item to itself be reception-eligible — a strict AND, not per-item. One prepaid-only
 * item (e.g. an MRI) makes the whole booking prepaid-only, never partially applied.
 */
export async function computePayAtReceptionEligibility(cart: Cart): Promise<boolean> {
  const org = await prisma.organization.findUniqueOrThrow({ where: { id: cart.organizationId } });
  if (org.paymentMode !== "ONLINE_AND_RECEPTION") return false;

  const radiologyExamIds = [
    ...new Set(
      cart.items
        .filter((item) => item.itemType === "RADIOLOGY_EXAM")
        .map((item) => item.radiologyExamId!),
    ),
  ];
  const labTestIds = [
    ...new Set(
      cart.items.filter((item) => item.itemType === "LAB_TEST").map((item) => item.labTestId!),
    ),
  ];
  // HOME_COLLECTION_CHARGE is a service surcharge, not a catalogue item — it never itself
  // gates the mixed-cart rule.

  const [exams, tests] = await Promise.all([
    radiologyExamIds.length > 0
      ? prisma.radiologyExam.findMany({
          where: { id: { in: radiologyExamIds } },
          select: { payAtReceptionEligible: true },
        })
      : Promise.resolve([]),
    labTestIds.length > 0
      ? prisma.labTest.findMany({
          where: { id: { in: labTestIds } },
          select: { payAtReceptionEligible: true },
        })
      : Promise.resolve([]),
  ]);

  return [...exams, ...tests].every((item) => item.payAtReceptionEligible);
}

export interface BookingSummaryScheduleEntry {
  type: "RADIOLOGY" | "LAB" | "HOME_COLLECTION_WINDOW";
  date: string;
  startTime: string;
  endTime: string;
}

export interface BookingSummary {
  items: Array<{ id: string; itemType: string; name: string; price: number }>;
  centre: { id: string; name: string; address: string } | null;
  schedule: BookingSummaryScheduleEntry[];
  patientName: string | null;
  subtotal: number;
  homeCollectionCharge: number | null;
  total: number;
  payAtReceptionEligible: boolean;
}

/** §4.2 SC6 — two schedule entries for a Combined booking, one otherwise. */
export async function getBookingSummary(token: string): Promise<BookingSummary> {
  const cart = getCart(token);

  const [centre, holds, patient, payAtReceptionEligible] = await Promise.all([
    cart.centreId
      ? prisma.centre.findUnique({ where: { id: cart.centreId } })
      : Promise.resolve(null),
    prisma.slotHold.findMany({
      where: { cartToken: token, expiresAt: { gt: new Date() } },
      include: { slot: true },
      orderBy: { slot: { startTime: "asc" } },
    }),
    cart.patientId
      ? prisma.patient.findUnique({ where: { id: cart.patientId } })
      : Promise.resolve(null),
    computePayAtReceptionEligibility(cart),
  ]);

  const homeChargeItem = cart.items.find((item) => item.itemType === "HOME_COLLECTION_CHARGE");
  const subtotal = cart.items.reduce((sum, item) => sum + item.price, 0);

  return {
    items: cart.items.map((item) => ({
      id: item.id,
      itemType: item.itemType,
      name: item.name,
      price: item.price,
    })),
    centre: centre ? { id: centre.id, name: centre.name, address: centre.address } : null,
    schedule: holds.map((hold) => ({
      type: hold.slot.type,
      date: hold.slot.date.toISOString().slice(0, 10),
      startTime: hold.slot.startTime.toISOString().slice(11, 16),
      endTime: hold.slot.endTime.toISOString().slice(11, 16),
    })),
    patientName: patient?.name ?? null,
    subtotal,
    homeCollectionCharge: homeChargeItem ? homeChargeItem.price : null,
    total: subtotal,
    payAtReceptionEligible,
  };
}
