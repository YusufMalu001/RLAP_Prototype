import { randomBytes } from "crypto";
import { prisma } from "@rlap/db";
import type { AlcoholConsumption, Gender, Patient, SmokingStatus } from "@rlap/db";
import { HttpError } from "../lib/httpError";
import { patientSessionStore } from "./store";
import type { PatientSession } from "./types";

export class PatientSessionError extends HttpError {}

const PATIENT_SESSION_TTL_SECONDS = 30 * 60;

function generateToken(): string {
  return randomBytes(24).toString("base64url");
}

export function createPatientSession(
  organizationId: string,
  mobileNumber: string,
  patientId: string,
): PatientSession {
  const now = new Date();
  const session: PatientSession = {
    token: generateToken(),
    organizationId,
    mobileNumber,
    patientId,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + PATIENT_SESSION_TTL_SECONDS * 1000).toISOString(),
  };
  patientSessionStore.set(session);
  return session;
}

export function getPatientSession(token: string): PatientSession {
  const session = patientSessionStore.get(token);
  if (!session) {
    throw new PatientSessionError(404, "Patient session not found or expired");
  }
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    throw new PatientSessionError(410, "Patient session has expired — verify OTP again");
  }
  return session;
}

export interface PatientDetailsInput {
  name: string;
  dobOrAge: string;
  gender: Gender;
  email?: string;
}

/** Single patient per booking, enforced structurally: this always updates the one Patient
 * row the session was created against — there is no path to attach a second patient. */
export async function savePatientDetails(
  token: string,
  details: PatientDetailsInput,
): Promise<Patient> {
  const session = getPatientSession(token);
  return prisma.patient.update({
    where: { id: session.patientId },
    data: {
      name: details.name,
      dobOrAge: details.dobOrAge,
      gender: details.gender,
      email: details.email,
    },
  });
}

/** Full profile view: identity + self-reported medical history + completed-booking history,
 * behind the same session token reports already use — never required to book, only to enrich
 * future recommendations. */
export async function getPatientProfile(token: string) {
  const session = getPatientSession(token);
  const patient = await prisma.patient.findUniqueOrThrow({ where: { id: session.patientId } });
  const bookings = await prisma.booking.findMany({
    where: { patientId: session.patientId, status: "COMPLETED" },
    include: { centre: true, lineItems: { include: { radiologyExam: true, labTest: true } } },
    orderBy: { createdAt: "desc" },
  });

  return {
    patient,
    reports: bookings.map((booking) => ({
      id: booking.id,
      bookingCode: booking.bookingCode,
      type: booking.type,
      centre: { id: booking.centre.id, name: booking.centre.name },
      items: booking.lineItems.map((item) => item.radiologyExam?.name ?? item.labTest?.name ?? ""),
      totalAmount: Number(booking.totalAmount),
      createdAt: booking.createdAt.toISOString(),
    })),
  };
}

export interface MedicalHistoryInput {
  heightCm?: number | null;
  weightKg?: number | null;
  allergies?: string | null;
  chronicConditions?: string | null;
  currentMedications?: string | null;
  familyMedicalHistory?: string | null;
  smokingStatus?: SmokingStatus | null;
  alcoholConsumption?: AlcoholConsumption | null;
  medicalNotes?: string | null;
}

export async function saveMedicalHistory(
  token: string,
  input: MedicalHistoryInput,
): Promise<Patient> {
  const session = getPatientSession(token);
  return prisma.patient.update({
    where: { id: session.patientId },
    data: input,
  });
}
