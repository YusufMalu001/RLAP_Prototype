import { Router } from "express";
import { prisma } from "@rlap/db";
import type { PaymentMode } from "@rlap/db";
import { asyncHandler } from "../../lib/asyncHandler";
import { HttpError } from "../../lib/httpError";

export const adminOrganizationRouter = Router();

const PAYMENT_MODES = new Set<PaymentMode>(["ONLINE_ONLY", "ONLINE_AND_RECEPTION"]);

adminOrganizationRouter.get(
  "/organization",
  asyncHandler(async (req, res) => {
    const org = await prisma.organization.findUniqueOrThrow({
      where: { id: req.adminUser!.organizationId },
    });
    res.json({ organization: org });
  }),
);

// §5.5: payment mode is the one toggle that can take Pay at Reception off the table
// organization-wide; branding fields are cosmetic only (logo + primary colour);
// remindersEnabled is the per-org reminder-notification toggle called for in §5.8.
adminOrganizationRouter.patch(
  "/organization",
  asyncHandler(async (req, res) => {
    const b = req.body ?? {};
    if (b.paymentMode !== undefined && !PAYMENT_MODES.has(b.paymentMode)) {
      throw new HttpError(400, `Invalid paymentMode "${b.paymentMode}"`);
    }
    const org = await prisma.organization.update({
      where: { id: req.adminUser!.organizationId },
      data: {
        paymentMode: b.paymentMode,
        logoUrl: b.logoUrl === undefined ? undefined : (b.logoUrl ?? null),
        primaryColor: b.primaryColor === undefined ? undefined : (b.primaryColor ?? null),
        remindersEnabled: typeof b.remindersEnabled === "boolean" ? b.remindersEnabled : undefined,
      },
    });
    res.json({ organization: org });
  }),
);
