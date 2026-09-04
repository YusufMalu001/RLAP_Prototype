import { prisma } from "@rlap/db";
import { CartError, getCart } from "./cartService";
import { getCentresForCart } from "./centresForCart";
import { cartStore } from "./store";
import type { Cart } from "./types";

export async function setCentreOnCart(token: string, centreId: string): Promise<Cart> {
  const cart = getCart(token);

  const centre = await prisma.centre.findUnique({ where: { id: centreId } });
  if (!centre) throw new CartError(404, "Centre not found");
  if (centre.organizationId !== cart.organizationId) {
    throw new CartError(400, "Centre does not belong to this cart's organization");
  }

  // Re-run the same matching rule the GET /centres endpoint uses, so a client can never set a
  // centre that doesn't actually offer everything currently in the cart.
  const matches = await getCentresForCart(token);
  if (!matches.some((match) => match.id === centreId)) {
    throw new CartError(400, "This centre does not offer everything currently in the cart");
  }

  cart.centreId = centreId;
  cart.updatedAt = new Date().toISOString();
  cartStore.set(cart);
  return cart;
}
