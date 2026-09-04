import type { Centre } from "@rlap/db";
import { findMatchingCentres } from "../centres/matching";
import { computeCartType, getCart } from "./cartService";

/**
 * §4.2 R6/L5b/C2 + Cross-Cutting Rules: RADIOLOGY carts match on radiology items only, LAB
 * carts match on lab items only (and only for the Visit-the-Centre path — Home Collection
 * skips centre selection entirely), and COMBINED carts require a single centre offering
 * everything. `collectionMode` starts null until the patient reaches L4; null is treated as
 * "still on/eligible for the centre-visit path" since no dedicated endpoint sets it to
 * CENTRE_VISIT explicitly — only choosing Home Collection (saving an address) moves it away.
 */
export async function getCentresForCart(token: string): Promise<Centre[]> {
  const cart = getCart(token);
  const cartType = computeCartType(cart.items);

  if (cartType === null) return [];
  if (cartType === "LAB" && cart.collectionMode === "HOME_COLLECTION") return [];

  const radiologyExamIds = cart.items
    .filter((item) => item.itemType === "RADIOLOGY_EXAM")
    .map((item) => item.radiologyExamId!);
  const labTestIds = cart.items
    .filter((item) => item.itemType === "LAB_TEST")
    .map((item) => item.labTestId!);

  return findMatchingCentres(cart.organizationId, radiologyExamIds, labTestIds);
}
