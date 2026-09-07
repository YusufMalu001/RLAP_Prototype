import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { requireAdmin } from "../../admin/adminAuthMiddleware";
import { ADMIN_SESSION_COOKIE, login, logout } from "../../admin/sessionService";

export const adminAuthRouter = Router();

const isProduction = process.env.NODE_ENV === "production";
const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  signed: true,
  // The admin app and API are deployed to different domains (Vercel + Render/Railway/Fly), so
  // this cookie must survive a cross-site fetch — "lax" is dropped on those, "none" is not.
  // "none" requires secure:true, which only makes sense once we're actually on HTTPS.
  sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
  secure: isProduction,
  path: "/",
};

adminAuthRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body ?? {};
    if (typeof email !== "string" || typeof password !== "string") {
      res.status(400).json({ error: "email and password are required" });
      return;
    }
    const { token, expiresAt, admin } = await login(email, password);
    res.cookie(ADMIN_SESSION_COOKIE, token, {
      ...SESSION_COOKIE_OPTIONS,
      expires: expiresAt,
    });
    res.json({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      organizationId: admin.organizationId,
    });
  }),
);

adminAuthRouter.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const token = req.signedCookies?.[ADMIN_SESSION_COOKIE];
    if (typeof token === "string") await logout(token);
    res.clearCookie(ADMIN_SESSION_COOKIE, { path: "/" });
    res.json({ ok: true });
  }),
);

adminAuthRouter.get("/me", requireAdmin, (req, res) => {
  const admin = req.adminUser!;
  res.json({
    id: admin.id,
    email: admin.email,
    name: admin.name,
    organizationId: admin.organizationId,
  });
});
