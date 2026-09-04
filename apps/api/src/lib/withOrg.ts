import { prisma } from "@rlap/db";
import type { Organization } from "@rlap/db";
import type { Request, Response } from "express";
import { asyncHandler } from "./asyncHandler";

export function withOrg(
  handler: (req: Request, res: Response, org: Organization) => Promise<void>,
) {
  return asyncHandler(async (req, res) => {
    const org = await prisma.organization.findUnique({ where: { slug: req.params.orgSlug } });
    if (!org) {
      res.status(404).json({ error: "Organization not found" });
      return;
    }
    await handler(req, res, org);
  });
}
