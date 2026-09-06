import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import {
  getPatientProfile,
  saveMedicalHistory,
  savePatientDetails,
} from "../patientSession/patientSessionService";
import type {
  MedicalHistoryInput,
  PatientDetailsInput,
} from "../patientSession/patientSessionService";

export const patientSessionRouter = Router();

const VALID_GENDERS = new Set(["MALE", "FEMALE", "OTHER"]);
const VALID_SMOKING_STATUSES = new Set(["NEVER", "FORMER", "CURRENT"]);
const VALID_ALCOHOL_LEVELS = new Set(["NONE", "OCCASIONAL", "REGULAR"]);

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

patientSessionRouter.get(
  "/:token/profile",
  asyncHandler(async (req, res) => {
    const profile = await getPatientProfile(req.params.token!);
    res.json(profile);
  }),
);

function parseMedicalHistory(body: unknown): MedicalHistoryInput | null {
  if (Array.isArray(body) || typeof body !== "object" || body === null) return null;
  const record = body as Record<string, unknown>;

  const optionalString = (key: string): string | null | undefined => {
    if (!(key in record)) return undefined;
    const value = record[key];
    if (value === null) return null;
    return typeof value === "string" ? value : undefined;
  };
  const optionalInt = (key: string): number | null | undefined => {
    if (!(key in record)) return undefined;
    const value = record[key];
    if (value === null) return null;
    return typeof value === "number" && Number.isFinite(value) ? Math.round(value) : undefined;
  };

  const smokingStatus = optionalString("smokingStatus");
  if (smokingStatus && !VALID_SMOKING_STATUSES.has(smokingStatus)) return null;
  const alcoholConsumption = optionalString("alcoholConsumption");
  if (alcoholConsumption && !VALID_ALCOHOL_LEVELS.has(alcoholConsumption)) return null;

  return {
    heightCm: optionalInt("heightCm"),
    weightKg: optionalInt("weightKg"),
    allergies: optionalString("allergies"),
    chronicConditions: optionalString("chronicConditions"),
    currentMedications: optionalString("currentMedications"),
    familyMedicalHistory: optionalString("familyMedicalHistory"),
    smokingStatus: smokingStatus as MedicalHistoryInput["smokingStatus"],
    alcoholConsumption: alcoholConsumption as MedicalHistoryInput["alcoholConsumption"],
    medicalNotes: optionalString("medicalNotes"),
  };
}

patientSessionRouter.patch(
  "/:token/medical-history",
  asyncHandler(async (req, res) => {
    const input = parseMedicalHistory(req.body);
    if (!input) {
      res.status(400).json({ error: "Invalid medical history payload" });
      return;
    }
    const patient = await saveMedicalHistory(req.params.token!, input);
    res.json({ patient });
  }),
);
