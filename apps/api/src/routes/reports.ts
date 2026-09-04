import { Router } from "express";
import { prisma } from "@rlap/db";
import { withOrg } from "../lib/withOrg";
import { sendOtp, verifyOtp } from "../otp/otpService";
import { getPatientSession } from "../patientSession/patientSessionService";
import { HttpError } from "../lib/httpError";

export const reportsRouter = Router();

reportsRouter.post(
  "/orgs/:orgSlug/reports/send-otp",
  withOrg(async (req, res, org) => {
    const mobile = req.body?.mobile;
    if (typeof mobile !== "string") {
      res.status(400).json({ error: "mobile is required" });
      return;
    }
    res.json(await sendOtp(org.id, mobile));
  }),
);

reportsRouter.post(
  "/orgs/:orgSlug/reports/verify-otp",
  withOrg(async (req, res, org) => {
    const { mobile, code } = req.body ?? {};
    if (typeof mobile !== "string" || typeof code !== "string") {
      res.status(400).json({ error: "mobile and code are required" });
      return;
    }
    res.json(await verifyOtp(org.id, mobile, code));
  }),
);

// §5.7: reports only ever surface COMPLETED bookings, and only behind a verified patient session.
reportsRouter.get(
  "/orgs/:orgSlug/reports",
  withOrg(async (req, res, org) => {
    const token = req.query.patientSessionToken;
    if (typeof token !== "string") {
      res.status(400).json({ error: "patientSessionToken is required" });
      return;
    }
    const session = getPatientSession(token);
    if (session.organizationId !== org.id) {
      throw new HttpError(400, "This patient session does not belong to this organization");
    }

    const bookings = await prisma.booking.findMany({
      where: { patientId: session.patientId, organizationId: org.id, status: "COMPLETED" },
      include: { centre: true, lineItems: { include: { radiologyExam: true, labTest: true } } },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      bookings: bookings.map((booking) => ({
        id: booking.id,
        bookingCode: booking.bookingCode,
        type: booking.type,
        centre: { id: booking.centre.id, name: booking.centre.name },
        items: booking.lineItems.map(
          (item) => item.radiologyExam?.name ?? item.labTest?.name ?? "",
        ),
        totalAmount: Number(booking.totalAmount),
        createdAt: booking.createdAt.toISOString(),
      })),
    });
  }),
);
