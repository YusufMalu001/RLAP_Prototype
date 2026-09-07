import { prisma } from "@rlap/db";
import { llmProvider } from "../integrations/llm";
import { getCart } from "./cartService";

export interface LabRecommendation {
  id: string;
  name: string;
  category: string;
  price: number;
  homeCollectionEligible: boolean;
  rationale: string;
}

/** Suggests lab tests complementary to whatever radiology exams are already in the cart —
 * never any test already added, and only ever from this org's real, bookable catalogue. Empty
 * cart or a cart with no radiology items yields an empty (not erroring) list. */
export async function getLabRecommendations(token: string): Promise<LabRecommendation[]> {
  const cart = getCart(token);
  const radiologyExamNames = cart.items
    .filter((item) => item.itemType === "RADIOLOGY_EXAM")
    .map((item) => item.name);
  if (radiologyExamNames.length === 0) return [];

  const alreadyInCart = new Set(cart.items.map((item) => item.labTestId).filter(Boolean));

  const labTests = await prisma.labTest.findMany({
    where: { organizationId: cart.organizationId },
    select: { id: true, name: true, category: true, price: true, homeCollectionEligible: true },
  });
  const candidates = labTests.filter((t) => !alreadyInCart.has(t.id));
  if (candidates.length === 0) return [];

  const suggestions = await llmProvider.suggestLabTests(
    radiologyExamNames,
    candidates.map((c) => ({ id: c.id, name: c.name, category: c.category })),
  );

  const byId = new Map(candidates.map((c) => [c.id, c]));
  return suggestions
    .map((s) => {
      const test = byId.get(s.id);
      if (!test) return null;
      return {
        id: test.id,
        name: test.name,
        category: test.category,
        price: Number(test.price),
        homeCollectionEligible: test.homeCollectionEligible,
        rationale: s.rationale,
      };
    })
    .filter((r): r is LabRecommendation => r !== null);
}
