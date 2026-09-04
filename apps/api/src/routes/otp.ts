import { Router } from "express";
import { withOrg } from "../lib/withOrg";
import { sendOtp, verifyOtp } from "../otp/otpService";

export const otpRouter = Router();

otpRouter.post(
  "/orgs/:orgSlug/otp/send",
  withOrg(async (req, res, org) => {
    const mobile = req.body?.mobile;
    if (typeof mobile !== "string") {
      res.status(400).json({ error: "mobile is required" });
      return;
    }
    res.json(await sendOtp(org.id, mobile));
  }),
);

otpRouter.post(
  "/orgs/:orgSlug/otp/verify",
  withOrg(async (req, res, org) => {
    const { mobile, code, cartToken } = req.body ?? {};
    if (typeof mobile !== "string" || typeof code !== "string") {
      res.status(400).json({ error: "mobile and code are required" });
      return;
    }
    res.json(
      await verifyOtp(org.id, mobile, code, typeof cartToken === "string" ? cartToken : undefined),
    );
  }),
);
