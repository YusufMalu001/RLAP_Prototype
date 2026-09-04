import type { NextFunction, Request, Response } from "express";
import type { AdminUser } from "@rlap/db";
import { ADMIN_SESSION_COOKIE, AdminAuthError, getSessionAdmin } from "./sessionService";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      adminUser?: AdminUser;
    }
  }
}

/** Protects every /api/admin/* route except login — a request either carries a valid
 * signed session cookie or gets a 401, no partial/unauthenticated access. */
export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.signedCookies?.[ADMIN_SESSION_COOKIE];
  if (typeof token !== "string") {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    req.adminUser = await getSessionAdmin(token);
    next();
  } catch (err) {
    if (err instanceof AdminAuthError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    next(err);
  }
}
