import { randomBytes } from "crypto";
import { prisma } from "@rlap/db";
import type { Gender, Patient } from "@rlap/db";
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
