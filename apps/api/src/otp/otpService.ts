import { prisma } from "@rlap/db";
import { HttpError } from "../lib/httpError";
import { buildOtpMessage, generateOtpCode, otpProvider } from "../integrations/otp";
import { createPatientSession } from "../patientSession/patientSessionService";
import { attachPatientToCart } from "../cart/cartService";

export class OtpError extends HttpError {
  retryAfterSeconds?: number;

  constructor(status: number, message: string, retryAfterSeconds?: number) {
    super(status, message);
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

const MOBILE_NUMBER_PATTERN = /^[6-9]\d{9}$/;
export const OTP_RESEND_COOLDOWN_SECONDS = 30;
const OTP_VALIDITY_SECONDS = 5 * 60;

function assertValidMobile(mobileNumber: string): void {
  if (!MOBILE_NUMBER_PATTERN.test(mobileNumber)) {
    throw new OtpError(400, "mobile must be a valid 10-digit mobile number");
  }
}

export interface SendOtpResult {
  resendAvailableInSeconds: number;
  devOtp?: string;
}

export async function sendOtp(
  organizationId: string,
  mobileNumber: string,
): Promise<SendOtpResult> {
  assertValidMobile(mobileNumber);

  // Cooldown is tracked purely off the last OtpVerification row's createdAt — no separate
  // "last sent" column needed.
  const latest = await prisma.otpVerification.findFirst({
    where: { organizationId, mobileNumber },
    orderBy: { createdAt: "desc" },
  });

  if (latest) {
    const secondsSinceSent = (Date.now() - latest.createdAt.getTime()) / 1000;
    if (secondsSinceSent < OTP_RESEND_COOLDOWN_SECONDS) {
      const retryAfterSeconds = Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - secondsSinceSent);
      throw new OtpError(
        429,
        `Please wait ${retryAfterSeconds}s before requesting another OTP`,
        retryAfterSeconds,
      );
    }
  }

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_VALIDITY_SECONDS * 1000);

  await prisma.otpVerification.create({
    data: { organizationId, mobileNumber, otpCode: code, expiresAt },
  });

  await otpProvider.send(mobileNumber, buildOtpMessage(code));

  return {
    resendAvailableInSeconds: OTP_RESEND_COOLDOWN_SECONDS,
    // Never present in production — see integrations/otp.ts for the real transport.
    devOtp: process.env.NODE_ENV !== "production" ? code : undefined,
  };
}

export interface VerifyOtpResult {
  sessionToken: string;
  expiresAt: string;
  isExistingPatient: boolean;
  patient: {
    id: string;
    mobileNumber: string;
    name: string | null;
    dobOrAge: string | null;
    gender: string | null;
    email: string | null;
  };
}

export async function verifyOtp(
  organizationId: string,
  mobileNumber: string,
  code: string,
  cartToken?: string,
): Promise<VerifyOtpResult> {
  assertValidMobile(mobileNumber);

  const latest = await prisma.otpVerification.findFirst({
    where: { organizationId, mobileNumber },
    orderBy: { createdAt: "desc" },
  });

  if (!latest) {
    throw new OtpError(400, "No OTP was requested for this mobile number");
  }
  if (latest.verified) {
    throw new OtpError(400, "This OTP has already been used — request a new one");
  }
  if (latest.expiresAt.getTime() < Date.now()) {
    throw new OtpError(400, "OTP has expired — request a new one");
  }

  // No lockout per spec (§3.6/§5.8) — the attempt is still recorded for observability, but a
  // wrong code is always just "try again," never blocked.
  await prisma.otpVerification.update({
    where: { id: latest.id },
    data: { attemptCount: { increment: 1 } },
  });

  if (latest.otpCode !== code) {
    throw new OtpError(400, "Incorrect OTP — please try again");
  }

  await prisma.otpVerification.update({ where: { id: latest.id }, data: { verified: true } });

  const existingPatient = await prisma.patient.findUnique({
    where: { organizationId_mobileNumber: { organizationId, mobileNumber } },
  });

  // Match found -> that's the row we return (drives SC5 pre-fill). No match -> a bare
  // identity-anchor row is created now (name/dobOrAge/gender stay null); the patient fills
  // those in at POST /api/patient-session/:token/details (SC5), never fabricated here.
  const patient =
    existingPatient ??
    (await prisma.patient.create({
      data: { organizationId, mobileNumber },
    }));

  const session = createPatientSession(organizationId, mobileNumber, patient.id);

  // Links "patient identified" onto the cart itself so /cart/:token/confirm and /summary can
  // read it directly (§3.6 — OTP happens mid-flow, while a cart/hold already exists).
  if (cartToken) {
    attachPatientToCart(cartToken, patient.id);
  }

  return {
    sessionToken: session.token,
    expiresAt: session.expiresAt,
    isExistingPatient: existingPatient !== null,
    patient: {
      id: patient.id,
      mobileNumber: patient.mobileNumber,
      name: patient.name,
      dobOrAge: patient.dobOrAge,
      gender: patient.gender,
      email: patient.email,
    },
  };
}
