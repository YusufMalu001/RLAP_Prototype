import { randomUUID } from "crypto";
import { prisma } from "@rlap/db";
import { findMatchingCentres } from "../centres/matching";
import { CartError, computeCartType, getCart } from "./cartService";
import { cartStore } from "./store";
import type { Cart, HomeCollectionAddress } from "./types";

// 6-digit Indian PIN code, first digit non-zero.
const PIN_CODE_PATTERN = /^[1-9][0-9]{5}$/;

export interface PinCheckResult {
  serviceable: boolean;
  homeCollectionCharge: number | null;
}

interface ServiceabilityResolution extends PinCheckResult {
  // Home collection is centre-agnostic in the UI (§4.2 L5a never shows a centre picker), but
  // every Slot/Booking row is still centre-owned in the schema — this is the centre that will
  // actually dispatch the phlebotomist, resolved silently so slot listing and confirmBooking
  // (which requires cart.centreId) have something to key off. A PIN whose ServiceableArea is
  // scoped to one centre must resolve to that centre; an org-wide PIN falls back to any centre
  // that offers every lab test in the cart. If no such centre exists, treat as not serviceable
  // rather than booking against a centre that can't actually fulfil the cart.
  centreId: string | null;
}

async function checkServiceability(
  organizationId: string,
  labTestIds: string[],
  pinCode: string,
): Promise<ServiceabilityResolution> {
  const uniqueLabTestIds = [...new Set(labTestIds)];
  if (uniqueLabTestIds.length === 0) {
    return { serviceable: false, homeCollectionCharge: null, centreId: null };
  }

  const tests = await prisma.labTest.findMany({
    where: { id: { in: uniqueLabTestIds } },
    select: { homeCollectionEligible: true },
  });
  if (tests.length === 0 || tests.some((test) => !test.homeCollectionEligible)) {
    return { serviceable: false, homeCollectionCharge: null, centreId: null };
  }

  const [areas, matchingCentres] = await Promise.all([
    prisma.serviceableArea.findMany({ where: { organizationId, pinCode, isActive: true } }),
    findMatchingCentres(organizationId, [], uniqueLabTestIds),
  ]);
  if (areas.length === 0 || matchingCentres.length === 0) {
    return { serviceable: false, homeCollectionCharge: null, centreId: null };
  }
  const matchingCentreIds = new Set(matchingCentres.map((centre) => centre.id));

  // Prefer an area scoped to a centre that can actually fulfil the cart; fall back to an
  // org-wide area (centreId null) paired with any fulfilling centre. Either way, pick the
  // cheapest usable area's charge — same "min charge" behaviour as before this fix.
  const centreScopedUsable = areas.filter(
    (area) => area.centreId !== null && matchingCentreIds.has(area.centreId),
  );
  const orgWideUsable = areas.filter((area) => area.centreId === null);

  if (centreScopedUsable.length > 0) {
    const cheapest = centreScopedUsable.reduce((min, area) =>
      Number(area.homeCollectionCharge) < Number(min.homeCollectionCharge) ? area : min,
    );
    return {
      serviceable: true,
      homeCollectionCharge: Number(cheapest.homeCollectionCharge),
      centreId: cheapest.centreId,
    };
  }

  if (orgWideUsable.length > 0) {
    const cheapest = orgWideUsable.reduce((min, area) =>
      Number(area.homeCollectionCharge) < Number(min.homeCollectionCharge) ? area : min,
    );
    return {
      serviceable: true,
      homeCollectionCharge: Number(cheapest.homeCollectionCharge),
      centreId: matchingCentres[0]!.id,
    };
  }

  // Every matching area is scoped to a centre that doesn't offer everything in this cart.
  return { serviceable: false, homeCollectionCharge: null, centreId: null };
}

/** Combined bookings are centre-visit only (§2.3) — home collection only ever applies to LAB carts. */
export async function checkHomeCollectionPin(
  token: string,
  pinCode: string,
): Promise<PinCheckResult> {
  if (!PIN_CODE_PATTERN.test(pinCode)) {
    throw new CartError(400, "PIN code must be a 6-digit Indian postal code");
  }

  const cart = getCart(token);
  if (computeCartType(cart.items) !== "LAB") {
    return { serviceable: false, homeCollectionCharge: null };
  }

  const labTestIds = cart.items
    .filter((item) => item.itemType === "LAB_TEST")
    .map((item) => item.labTestId!);
  // centreId is an internal resolution detail (saveHomeCollectionAddress needs it) — never
  // part of the patient-facing contract, so it's stripped back down to PinCheckResult's shape.
  const { serviceable, homeCollectionCharge } = await checkServiceability(
    cart.organizationId,
    labTestIds,
    pinCode,
  );
  return { serviceable, homeCollectionCharge };
}

export async function saveHomeCollectionAddress(
  token: string,
  address: HomeCollectionAddress,
): Promise<Cart> {
  if (!PIN_CODE_PATTERN.test(address.pinCode)) {
    throw new CartError(400, "PIN code must be a 6-digit Indian postal code");
  }
  if (!address.houseNumber.trim() || !address.street.trim()) {
    throw new CartError(400, "houseNumber and street are required");
  }

  const cart = getCart(token);
  if (computeCartType(cart.items) !== "LAB") {
    throw new CartError(400, "Home collection is only available for lab-only carts");
  }

  const labTestIds = cart.items
    .filter((item) => item.itemType === "LAB_TEST")
    .map((item) => item.labTestId!);
  const result = await checkServiceability(cart.organizationId, labTestIds, address.pinCode);
  if (!result.serviceable) {
    throw new CartError(
      400,
      "This PIN is not serviceable for home collection with the current cart",
    );
  }

  cart.collectionMode = "HOME_COLLECTION";
  cart.homeCollectionAddress = address;
  // Silently resolved — never shown to the patient (§4.2 L5a has no centre picker) — but
  // required downstream: slot listing, the booking summary, and confirmBooking all key off
  // cart.centreId regardless of collection mode.
  cart.centreId = result.centreId!;
  // Re-saving an edited address replaces the previous charge line rather than stacking another one.
  cart.items = cart.items.filter((item) => item.itemType !== "HOME_COLLECTION_CHARGE");
  cart.items.push({
    id: randomUUID(),
    itemType: "HOME_COLLECTION_CHARGE",
    name: "Home Collection Charge",
    price: result.homeCollectionCharge!,
    addedAt: new Date().toISOString(),
    source: "MANUAL",
  });
  cart.updatedAt = new Date().toISOString();
  cartStore.set(cart);
  return cart;
}
