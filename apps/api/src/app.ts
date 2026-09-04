import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import type { HealthCheck } from "@rlap/types";
import { catalogueRouter } from "./routes/catalogue";
import { centresRouter } from "./routes/centres";
import { cartRouter } from "./routes/cart";
import { otpRouter } from "./routes/otp";
import { patientSessionRouter } from "./routes/patientSession";
import { bookingRouter } from "./routes/booking";
import { ocrRouter } from "./routes/ocr";
import { reportsRouter } from "./routes/reports";
import { adminRouter } from "./routes/admin";
import { HttpError } from "./lib/httpError";

export function createApp() {
  const app = express();

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use(cookieParser(process.env.COOKIE_SECRET ?? "dev-insecure-cookie-secret"));

  app.get("/api/health", (_req, res) => {
    const body: HealthCheck = { status: "ok", service: "rlap-api" };
    res.json(body);
  });

  app.get("/api/hello", (_req, res) => {
    res.json({ message: "Hello from the RLAP API" });
  });

  app.use("/api", catalogueRouter);
  app.use("/api", centresRouter);
  app.use("/api", otpRouter);
  app.use("/api", ocrRouter);
  app.use("/api", reportsRouter);
  app.use("/api/cart", cartRouter);
  app.use("/api/patient-session", patientSessionRouter);
  app.use("/api/bookings", bookingRouter);
  app.use("/api/admin", adminRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
