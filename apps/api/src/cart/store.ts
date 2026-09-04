import type { Cart } from "./types";

// In-memory cart store. Carts are pre-Booking session state (mirrors how SlotHold
// keys off a cart token rather than a Booking row) and don't need to survive a
// server restart — swap this for Redis when the API runs on more than one process.
const carts = new Map<string, Cart>();

export const cartStore = {
  get(token: string): Cart | undefined {
    return carts.get(token);
  },
  set(cart: Cart): void {
    carts.set(cart.token, cart);
  },
  delete(token: string): void {
    carts.delete(token);
  },
};
