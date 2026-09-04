import { prisma } from "@rlap/db";
import { getCart, isCartFlagged } from "./cartService";
import { cartStore } from "./store";
import type { SafetyCheckAnswers } from "./types";

/** Triggered only when the cart contains an MRI or contrast-based study (§2.3, §4.2 R7/C3). */
export async function isSafetyCheckRequired(token: string): Promise<boolean> {
  const cart = getCart(token);
  const radiologyExamIds = [
    ...new Set(
      cart.items
        .filter((item) => item.itemType === "RADIOLOGY_EXAM")
        .map((item) => item.radiologyExamId!),
    ),
  ];
  if (radiologyExamIds.length === 0) return false;

  const exams = await prisma.radiologyExam.findMany({
    where: { id: { in: radiologyExamIds } },
    select: { requiresSafetyCheck: true },
  });
  return exams.some((exam) => exam.requiresSafetyCheck);
}

export function submitSafetyCheck(token: string, answers: SafetyCheckAnswers): boolean {
  const cart = getCart(token);
  cart.safetyCheckAnswers = answers;
  cart.updatedAt = new Date().toISOString();
  cartStore.set(cart);
  return isCartFlagged(answers);
}
