import { Router } from "express";
import { requireAdmin } from "../../admin/adminAuthMiddleware";
import { adminAuthRouter } from "./auth";
import { adminDashboardRouter } from "./dashboard";
import { adminCatalogueRouter } from "./catalogue";
import { adminCentresRouter } from "./centres";
import { adminSlotsRouter } from "./slots";
import { adminBookingsRouter } from "./bookings";
import { adminNotificationsRouter } from "./notifications";
import { adminOrganizationRouter } from "./organization";

// Deliberately its own router tree, mounted separately from the patient-facing routes in
// app.ts, with its own auth middleware (admin session cookie, never the patient cart/OTP
// mechanisms) — every route below /login and /logout requires a valid admin session.
export const adminRouter = Router();

adminRouter.use("/auth", adminAuthRouter);

adminRouter.use(requireAdmin);
adminRouter.use("/dashboard", adminDashboardRouter);
adminRouter.use(adminCatalogueRouter);
adminRouter.use(adminCentresRouter);
adminRouter.use(adminSlotsRouter);
adminRouter.use(adminBookingsRouter);
adminRouter.use(adminNotificationsRouter);
adminRouter.use(adminOrganizationRouter);
