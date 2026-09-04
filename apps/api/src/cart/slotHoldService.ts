import { Prisma, prisma } from "@rlap/db";
import { CartError, getCart } from "./cartService";

export const SLOT_HOLD_DURATION_SECONDS = 10 * 60;

export interface SlotHoldResult {
  slotId: string;
  expiresAt: string;
  holdDurationSeconds: number;
}

/**
 * Holds one slot for 10 minutes (§4.2 R9/L7/C5, §5.9). Re-holding the SAME slot extends its
 * expiry rather than erroring. Re-holding a DIFFERENT slot of the SAME type (e.g. the patient
 * changes their mind on the radiology time) releases the old hold first — a cart never holds
 * two slots of one type at once. Runs at Serializable isolation so two carts racing for the
 * last seat on a slot can't both win; the loser gets a clean 409 to retry.
 */
export async function holdSlot(token: string, slotId: string): Promise<SlotHoldResult> {
  const cart = getCart(token);

  const slot = await prisma.slot.findUnique({ where: { id: slotId } });
  if (!slot) throw new CartError(404, "Slot not found");

  const centre = await prisma.centre.findUnique({ where: { id: slot.centreId } });
  if (!centre || centre.organizationId !== cart.organizationId) {
    throw new CartError(400, "Slot does not belong to this cart's organization");
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + SLOT_HOLD_DURATION_SECONDS * 1000);

  const attemptHold = () =>
    prisma.$transaction(
      async (tx) => {
        const activeCartHolds = await tx.slotHold.findMany({
          where: { cartToken: token, expiresAt: { gt: now } },
          include: { slot: true },
        });
        const staleSameTypeHolds = activeCartHolds.filter(
          (hold) => hold.slot.type === slot.type && hold.slotId !== slotId,
        );
        if (staleSameTypeHolds.length > 0) {
          await tx.slotHold.deleteMany({
            where: { id: { in: staleSameTypeHolds.map((hold) => hold.id) } },
          });
        }

        const activeHoldsFromOtherCarts = await tx.slotHold.count({
          where: { slotId, expiresAt: { gt: now }, cartToken: { not: token } },
        });
        const available = slot.capacity - slot.bookedCount - activeHoldsFromOtherCarts;
        if (available <= 0) {
          throw new CartError(409, "This slot is no longer available");
        }

        await tx.slotHold.upsert({
          where: { cartToken_slotId: { cartToken: token, slotId } },
          update: { expiresAt },
          create: { cartToken: token, organizationId: cart.organizationId, slotId, expiresAt },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

  // Postgres SERIALIZABLE can abort a transaction that doesn't actually conflict with anything
  // — a documented false-positive under concurrent load (SSI), not a bug. The standard fix is
  // to retry the whole transaction a few times before giving up; a genuine capacity conflict
  // (our own CartError, thrown inside the transaction above) is never retried.
  const MAX_SERIALIZATION_RETRIES = 3;
  for (let attempt = 1; attempt <= MAX_SERIALIZATION_RETRIES; attempt++) {
    try {
      await attemptHold();
      return {
        slotId,
        expiresAt: expiresAt.toISOString(),
        holdDurationSeconds: SLOT_HOLD_DURATION_SECONDS,
      };
    } catch (err) {
      const isSerializationFailure =
        err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2034";
      if (!isSerializationFailure) throw err;
      if (attempt === MAX_SERIALIZATION_RETRIES) {
        throw new CartError(
          409,
          "This slot is being booked by someone else right now — please try again",
        );
      }
    }
  }

  // Unreachable — the loop above always returns or throws.
  throw new CartError(500, "Failed to place slot hold");
}

export interface HoldStatus {
  expired: boolean;
  remainingSeconds?: number;
  expiresAt?: string;
}

/** Reports the soonest-expiring active hold — a Combined cart's dual holds share one countdown (§2.3). */
export async function getHoldStatus(token: string): Promise<HoldStatus> {
  getCart(token); // 404s on an unknown/garbage token instead of silently reporting "expired"

  const holds = await prisma.slotHold.findMany({
    where: { cartToken: token, expiresAt: { gt: new Date() } },
    orderBy: { expiresAt: "asc" },
    take: 1,
  });

  const soonest = holds[0];
  if (!soonest) return { expired: true };

  return {
    expired: false,
    remainingSeconds: Math.max(0, Math.round((soonest.expiresAt.getTime() - Date.now()) / 1000)),
    expiresAt: soonest.expiresAt.toISOString(),
  };
}
