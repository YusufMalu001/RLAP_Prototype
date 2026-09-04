import { prisma } from "@rlap/db";
import { getCart } from "./cartService";

export interface PreparationInstructionEntry {
  id: string;
  name: string;
  preparationInstructions: string | null;
}

export interface PreparationInstructionsResult {
  radiology: PreparationInstructionEntry[];
  lab: PreparationInstructionEntry[];
}

/** Grouped so Combined bookings can render "For your Scan" / "For your Lab Test" separately (§2.3, C4). */
export async function getPreparationInstructions(
  token: string,
): Promise<PreparationInstructionsResult> {
  const cart = getCart(token);
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

  const [radiology, lab] = await Promise.all([
    radiologyExamIds.length > 0
      ? prisma.radiologyExam.findMany({
          where: { id: { in: radiologyExamIds } },
          select: { id: true, name: true, preparationInstructions: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
    labTestIds.length > 0
      ? prisma.labTest.findMany({
          where: { id: { in: labTestIds } },
          select: { id: true, name: true, preparationInstructions: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  return { radiology, lab };
}
