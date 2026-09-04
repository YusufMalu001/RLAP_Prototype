import { prisma } from "@rlap/db";

// Not load-bearing for correctness — every capacity read already excludes holds where
// expiresAt <= now, so an expired-but-unswept row can't wrongly withhold a seat. This just
// keeps the SlotHold table from accumulating dead rows forever.
export async function sweepExpiredHolds(): Promise<number> {
  const { count } = await prisma.slotHold.deleteMany({ where: { expiresAt: { lte: new Date() } } });
  if (count > 0) {
    console.log(`[slot-hold-sweeper] released ${count} expired hold(s)`);
  }
  return count;
}

const DEFAULT_SWEEP_INTERVAL_MS = 60 * 1000;

export function startSlotHoldSweeper(
  intervalMs: number = DEFAULT_SWEEP_INTERVAL_MS,
): NodeJS.Timeout {
  return setInterval(() => {
    sweepExpiredHolds().catch((err) => console.error("[slot-hold-sweeper] sweep failed", err));
  }, intervalMs);
}
