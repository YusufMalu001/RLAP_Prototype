import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { savePatientDetails } from "../patientSession/patientSessionService";
import type { PatientDetailsInput } from "../patientSession/patientSessionService";

export const patientSessionRouter = Router();

const VALID_GENDERS = new Set(["MALE", "FEMALE", "OTHER"]);

function parseDetails(body: unknown): PatientDetailsInput | null {
  // "no array, just one record" — a client sending a list is rejected outright, not just
  // ignored, since that would otherwise silently accept the first element and hide the bug.
  if (Array.isArray(body) || typeof body !== "object" || body === null) return null;
  const record = body as Record<string, unknown>;

  if (typeof record.name !== "string" || record.name.trim().length === 0) return null;
  if (typeof record.dobOrAge !== "string" || record.dobOrAge.trim().length === 0) return null;
  if (typeof record.gender !== "string" || !VALID_GENDERS.has(record.gender)) return null;
  const email = typeof record.email === "string" ? record.email : undefined;

  return {
    name: record.name,
    dobOrAge: record.dobOrAge,
    gender: record.gender as PatientDetailsInput["gender"],
    email,
  };
}

patientSessionRouter.post(
  "/:token/details",
  asyncHandler(async (req, res) => {
    const details = parseDetails(req.body);
    if (!details) {
      res
        .status(400)
        .json({ error: "name, dobOrAge, and a valid gender (MALE|FEMALE|OTHER) are required" });
      return;
    }
    const patient = await savePatientDetails(req.params.token!, details);
    res.json({ patient });
  }),
);
