import { ocrProvider } from "../integrations/ocr";
import { addItem, getCart, serializeCart } from "./cartService";
import type { CartItem } from "./types";

export interface OcrMergeResult {
  totalFailure: boolean;
  addedHigh: CartItem[];
  addedLow: CartItem[];
  unmatched: string[];
  cart: ReturnType<typeof serializeCart>;
}

/**
 * §3.5: "no separate review screen" — everything lands straight in the cart. HIGH-confidence
 * lines become normal cart rows tagged source=OCR/ocrConfidence=HIGH; LOW-confidence lines are
 * added too but flagged (ocrConfidence=LOW, for the amber-outline treatment); anything OCR
 * couldn't match at all is returned as raw text for a "Search & Add" prompt, never added as a
 * cart row. Zero matches at all -> totalFailure, so the frontend shows the O4 fallback instead.
 */
export async function mergeOcrIntoCart(token: string, filename: string): Promise<OcrMergeResult> {
  const cart = getCart(token);
  const extraction = await ocrProvider.extract({ organizationId: cart.organizationId, filename });

  if (extraction.matched.length === 0) {
    return {
      totalFailure: true,
      addedHigh: [],
      addedLow: [],
      unmatched: extraction.unmatched.map((line) => line.rawText),
      cart: serializeCart(cart),
    };
  }

  const addedHigh: CartItem[] = [];
  const addedLow: CartItem[] = [];

  for (const line of extraction.matched) {
    const updated = await addItem(token, line.matchedItemType, line.matchedItemId, {
      source: "OCR",
      ocrConfidence: line.confidence,
    });
    const justAdded = updated.items[updated.items.length - 1]!;
    if (line.confidence === "HIGH") addedHigh.push(justAdded);
    else addedLow.push(justAdded);
  }

  return {
    totalFailure: false,
    addedHigh,
    addedLow,
    unmatched: extraction.unmatched.map((line) => line.rawText),
    cart: serializeCart(getCart(token)),
  };
}
