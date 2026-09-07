import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { CART_COOKIE_MAX_AGE_MS, CART_COOKIE_NAME } from "../cart/constants";
import {
  addItem,
  createCart,
  getCart,
  getNudge,
  isReadyForCheckout,
  removeItem,
  serializeCart,
} from "../cart/cartService";
import { getBookingSummary } from "../cart/bookingSummaryService";
import { setCentreOnCart } from "../cart/centreSelectionService";
import { getCentresForCart } from "../cart/centresForCart";
import { checkHomeCollectionPin, saveHomeCollectionAddress } from "../cart/homeCollectionService";
import { getLabRecommendations } from "../cart/labRecommendationService";
import { getPreparationInstructions } from "../cart/preparationInstructionsService";
import { isSafetyCheckRequired, submitSafetyCheck } from "../cart/safetyCheckService";
import { getHoldStatus, holdSlot } from "../cart/slotHoldService";
import { getSlotsForCart } from "../cart/slotsService";
import { SAFETY_CHECK_QUESTIONS } from "../cart/types";
import type { CartItemType, HomeCollectionAddress, SafetyCheckAnswers } from "../cart/types";
import { confirmBooking } from "../booking/confirmBookingService";

export const cartRouter = Router();

cartRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const orgSlug = req.body?.orgSlug;
    if (typeof orgSlug !== "string" || orgSlug.trim().length === 0) {
      res.status(400).json({ error: "orgSlug is required" });
      return;
    }

    const cart = await createCart(orgSlug);
    res.cookie(CART_COOKIE_NAME, cart.token, {
      signed: true,
      httpOnly: true,
      sameSite: "lax",
      maxAge: CART_COOKIE_MAX_AGE_MS,
    });
    res.status(201).json(serializeCart(cart));
  }),
);

cartRouter.get(
  "/:token",
  asyncHandler(async (req, res) => {
    res.json(serializeCart(getCart(req.params.token!)));
  }),
);

cartRouter.post(
  "/:token/items",
  asyncHandler(async (req, res) => {
    const { itemType, itemId } = req.body ?? {};
    if (itemType !== "RADIOLOGY_EXAM" && itemType !== "LAB_TEST") {
      res.status(400).json({ error: 'itemType must be "RADIOLOGY_EXAM" or "LAB_TEST"' });
      return;
    }
    if (typeof itemId !== "string" || itemId.trim().length === 0) {
      res.status(400).json({ error: "itemId is required" });
      return;
    }

    const cart = await addItem(req.params.token!, itemType as CartItemType, itemId);
    res.status(201).json(serializeCart(cart));
  }),
);

cartRouter.delete(
  "/:token/items/:itemId",
  asyncHandler(async (req, res) => {
    const cart = removeItem(req.params.token!, req.params.itemId!);
    res.json(serializeCart(cart));
  }),
);

cartRouter.get(
  "/:token/nudge",
  asyncHandler(async (req, res) => {
    res.json(getNudge(req.params.token!));
  }),
);

cartRouter.get(
  "/:token/ready-for-checkout",
  asyncHandler(async (req, res) => {
    res.json({ ready: isReadyForCheckout(req.params.token!) });
  }),
);

cartRouter.get(
  "/:token/centres",
  asyncHandler(async (req, res) => {
    const centres = await getCentresForCart(req.params.token!);
    res.json({ centres });
  }),
);

cartRouter.post(
  "/:token/centre",
  asyncHandler(async (req, res) => {
    const centreId = req.body?.centreId;
    if (typeof centreId !== "string" || centreId.trim().length === 0) {
      res.status(400).json({ error: "centreId is required" });
      return;
    }
    const cart = await setCentreOnCart(req.params.token!, centreId);
    res.json(serializeCart(cart));
  }),
);

cartRouter.post(
  "/:token/home-collection/check-pin",
  asyncHandler(async (req, res) => {
    const pinCode = req.body?.pinCode;
    if (typeof pinCode !== "string") {
      res.status(400).json({ error: "pinCode is required" });
      return;
    }
    res.json(await checkHomeCollectionPin(req.params.token!, pinCode));
  }),
);

function parseHomeCollectionAddress(body: unknown): HomeCollectionAddress | null {
  if (typeof body !== "object" || body === null) return null;
  const record = body as Record<string, unknown>;
  if (
    typeof record.pinCode !== "string" ||
    typeof record.houseNumber !== "string" ||
    typeof record.street !== "string"
  ) {
    return null;
  }
  const landmark = typeof record.landmark === "string" ? record.landmark : undefined;
  return {
    pinCode: record.pinCode,
    houseNumber: record.houseNumber,
    street: record.street,
    landmark,
  };
}

cartRouter.post(
  "/:token/home-collection/address",
  asyncHandler(async (req, res) => {
    const address = parseHomeCollectionAddress(req.body);
    if (!address) {
      res.status(400).json({ error: "pinCode, houseNumber, and street are required" });
      return;
    }
    const cart = await saveHomeCollectionAddress(req.params.token!, address);
    res.status(201).json(serializeCart(cart));
  }),
);

cartRouter.get(
  "/:token/safety-check-required",
  asyncHandler(async (req, res) => {
    res.json({ safetyCheckRequired: await isSafetyCheckRequired(req.params.token!) });
  }),
);

function parseSafetyCheckAnswers(body: unknown): SafetyCheckAnswers | null {
  if (typeof body !== "object" || body === null) return null;
  const record = (body as { answers?: unknown }).answers;
  if (typeof record !== "object" || record === null) return null;
  const answers = record as Record<string, unknown>;

  const result = {} as SafetyCheckAnswers;
  for (const key of SAFETY_CHECK_QUESTIONS) {
    const value = answers[key];
    if (typeof value !== "boolean") return null;
    result[key] = value;
  }
  return result;
}

cartRouter.post(
  "/:token/safety-check",
  asyncHandler(async (req, res) => {
    const answers = parseSafetyCheckAnswers(req.body);
    if (!answers) {
      res.status(400).json({
        error: `answers must include a boolean for each of: ${SAFETY_CHECK_QUESTIONS.join(", ")}`,
      });
      return;
    }
    const flagged = submitSafetyCheck(req.params.token!, answers);
    res.json({ flagged });
  }),
);

cartRouter.get(
  "/:token/recommendations",
  asyncHandler(async (req, res) => {
    res.json({ suggestions: await getLabRecommendations(req.params.token!) });
  }),
);

cartRouter.get(
  "/:token/preparation-instructions",
  asyncHandler(async (req, res) => {
    res.json(await getPreparationInstructions(req.params.token!));
  }),
);

cartRouter.get(
  "/:token/slots",
  asyncHandler(async (req, res) => {
    const centreId = req.query.centreId;
    const date = req.query.date;
    if (typeof centreId !== "string" || typeof date !== "string") {
      res.status(400).json({ error: "centreId and date query params are required" });
      return;
    }
    res.json(await getSlotsForCart(req.params.token!, centreId, date));
  }),
);

cartRouter.post(
  "/:token/slots/hold",
  asyncHandler(async (req, res) => {
    const slotId = req.body?.slotId;
    if (typeof slotId !== "string" || slotId.trim().length === 0) {
      res.status(400).json({ error: "slotId is required" });
      return;
    }
    res.status(201).json(await holdSlot(req.params.token!, slotId));
  }),
);

cartRouter.get(
  "/:token/hold-status",
  asyncHandler(async (req, res) => {
    res.json(await getHoldStatus(req.params.token!));
  }),
);

cartRouter.get(
  "/:token/summary",
  asyncHandler(async (req, res) => {
    res.json(await getBookingSummary(req.params.token!));
  }),
);

cartRouter.post(
  "/:token/confirm",
  asyncHandler(async (req, res) => {
    const paymentMethod = req.body?.paymentMethod;
    if (paymentMethod !== "ONLINE" && paymentMethod !== "PAY_AT_RECEPTION") {
      res.status(400).json({ error: 'paymentMethod must be "ONLINE" or "PAY_AT_RECEPTION"' });
      return;
    }
    const result = await confirmBooking(req.params.token!, { paymentMethod });
    res.status(201).json(result);
  }),
);
