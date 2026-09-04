import { randomBytes, randomUUID } from "crypto";
import { prisma } from "@rlap/db";
import type { LineItemSource, OcrConfidence } from "@rlap/db";
import { HttpError } from "../lib/httpError";
import { cartStore } from "./store";
import type { Cart, CartItem, CartItemType, CartType, SafetyCheckAnswers } from "./types";

export class CartError extends HttpError {}

function generateToken(): string {
  return randomBytes(24).toString("base64url");
}

function now(): string {
  return new Date().toISOString();
}

/** COMBINED as soon as both item types are present (spec §2.2) — recomputed on every read. */
export function computeCartType(items: CartItem[]): CartType {
  if (items.length === 0) return null;
  const hasRadiology = items.some((item) => item.itemType === "RADIOLOGY_EXAM");
  const hasLab = items.some((item) => item.itemType === "LAB_TEST");
  if (hasRadiology && hasLab) return "COMBINED";
  return hasRadiology ? "RADIOLOGY" : "LAB";
}

export async function createCart(organizationSlug: string): Promise<Cart> {
  const org = await prisma.organization.findUnique({ where: { slug: organizationSlug } });
  if (!org) throw new CartError(404, "Organization not found");

  const timestamp = now();
  const cart: Cart = {
    token: generateToken(),
    organizationId: org.id,
    organizationSlug: org.slug,
    items: [],
    collectionMode: null,
    homeCollectionAddress: null,
    centreId: null,
    safetyCheckAnswers: null,
    patientId: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  cartStore.set(cart);
  return cart;
}

export function getCart(token: string): Cart {
  const cart = cartStore.get(token);
  if (!cart) throw new CartError(404, "Cart not found or expired");
  return cart;
}

export interface AddItemMeta {
  source?: LineItemSource;
  ocrConfidence?: OcrConfidence;
}

export async function addItem(
  token: string,
  itemType: CartItemType,
  itemId: string,
  meta: AddItemMeta = {},
): Promise<Cart> {
  const cart = getCart(token);
  const source = meta.source ?? "MANUAL";

  let item: CartItem;
  if (itemType === "RADIOLOGY_EXAM") {
    const exam = await prisma.radiologyExam.findUnique({ where: { id: itemId } });
    if (!exam) throw new CartError(404, "Radiology exam not found");
    if (exam.organizationId !== cart.organizationId) {
      throw new CartError(400, "Item does not belong to this cart's organization");
    }
    item = {
      id: randomUUID(),
      itemType,
      radiologyExamId: exam.id,
      name: exam.name,
      price: Number(exam.price),
      addedAt: now(),
      source,
      ocrConfidence: meta.ocrConfidence,
    };
  } else {
    const test = await prisma.labTest.findUnique({ where: { id: itemId } });
    if (!test) throw new CartError(404, "Lab test not found");
    if (test.organizationId !== cart.organizationId) {
      throw new CartError(400, "Item does not belong to this cart's organization");
    }
    item = {
      id: randomUUID(),
      itemType,
      labTestId: test.id,
      name: test.name,
      price: Number(test.price),
      addedAt: now(),
      source,
      ocrConfidence: meta.ocrConfidence,
    };
  }

  cart.items.push(item);
  cart.updatedAt = now();
  cartStore.set(cart);
  return cart;
}

export function removeItem(token: string, itemId: string): Cart {
  const cart = getCart(token);
  const index = cart.items.findIndex((item) => item.id === itemId);
  if (index === -1) throw new CartError(404, "Cart item not found");
  cart.items.splice(index, 1);
  cart.updatedAt = now();
  cartStore.set(cart);
  return cart;
}

export interface NudgeResult {
  showNudge: boolean;
  direction: "SUGGEST_LAB" | "SUGGEST_RADIOLOGY" | null;
}

/** Cross-sell nudge (§4.2, R4/L3): shown only while the cart holds exactly one item type. */
export function getNudge(token: string): NudgeResult {
  const cart = getCart(token);
  const cartType = computeCartType(cart.items);
  if (cartType === "RADIOLOGY") return { showNudge: true, direction: "SUGGEST_LAB" };
  if (cartType === "LAB") return { showNudge: true, direction: "SUGGEST_RADIOLOGY" };
  return { showNudge: false, direction: null };
}

export function isReadyForCheckout(token: string): boolean {
  return getCart(token).items.length > 0;
}

/** Called by otpService.verifyOtp when it's passed this cart's token (§3.6). */
export function attachPatientToCart(token: string, patientId: string): Cart {
  const cart = getCart(token);
  cart.patientId = patientId;
  cart.updatedAt = now();
  cartStore.set(cart);
  return cart;
}

/** Any "yes" answer on the fixed safety questionnaire blocks online confirmation (§4.2 R7/C3). */
export function isCartFlagged(answers: SafetyCheckAnswers | null): boolean {
  if (!answers) return false;
  return Object.values(answers).some((value) => value === true);
}

export function serializeCart(cart: Cart) {
  return {
    token: cart.token,
    organizationSlug: cart.organizationSlug,
    items: cart.items,
    cartType: computeCartType(cart.items),
    subtotal: cart.items.reduce((sum, item) => sum + item.price, 0),
    collectionMode: cart.collectionMode,
    homeCollectionAddress: cart.homeCollectionAddress,
    centreId: cart.centreId,
    safetyCheckAnswers: cart.safetyCheckAnswers,
    blockedBySafety: isCartFlagged(cart.safetyCheckAnswers),
    patientId: cart.patientId,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
}
