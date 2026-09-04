import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { prisma } from "@rlap/db";
import { OTP_RESEND_COOLDOWN_SECONDS } from "../otp/otpService";
import { app, cleanupOrg, createTestOrg } from "./helpers";

const MOBILE = "9876543210";

describe("OTP send + verify", () => {
  let orgSlug: string;
  let orgId: string;

  beforeAll(async () => {
    const org = await createTestOrg("otp");
    orgSlug = org.slug;
    orgId = org.id;
  });

  afterAll(async () => {
    await cleanupOrg(orgId);
  });

  it("rejects an invalid mobile number", async () => {
    const res = await request(app).post(`/api/orgs/${orgSlug}/otp/send`).send({ mobile: "12345" });
    expect(res.status).toBe(400);
  });

  it("sends an OTP and exposes devOtp outside production", async () => {
    const res = await request(app)
      .post(`/api/orgs/${orgSlug}/otp/send`)
      .send({ mobile: "9111111111" });
    expect(res.status).toBe(200);
    expect(res.body.devOtp).toMatch(/^\d{6}$/);
    expect(res.body.resendAvailableInSeconds).toBe(OTP_RESEND_COOLDOWN_SECONDS);
  });

  it("enforces the 30s resend cooldown, and allows a resend once it has elapsed", async () => {
    const mobile = "9222222222";

    const first = await request(app).post(`/api/orgs/${orgSlug}/otp/send`).send({ mobile });
    expect(first.status).toBe(200);

    const immediateResend = await request(app)
      .post(`/api/orgs/${orgSlug}/otp/send`)
      .send({ mobile });
    expect(immediateResend.status).toBe(429);

    // Simulate the cooldown having elapsed rather than sleeping 30s in a test.
    await prisma.otpVerification.updateMany({
      where: { organizationId: orgId, mobileNumber: mobile },
      data: { createdAt: new Date(Date.now() - (OTP_RESEND_COOLDOWN_SECONDS + 1) * 1000) },
    });

    const resendAfterCooldown = await request(app)
      .post(`/api/orgs/${orgSlug}/otp/send`)
      .send({ mobile });
    expect(resendAfterCooldown.status).toBe(200);
  });

  it("allows free retry after a wrong code — no lockout", async () => {
    const mobile = "9333333333";
    const send = await request(app).post(`/api/orgs/${orgSlug}/otp/send`).send({ mobile });
    const correctCode = send.body.devOtp as string;

    const wrongAttempt1 = await request(app)
      .post(`/api/orgs/${orgSlug}/otp/verify`)
      .send({ mobile, code: "000000" });
    expect(wrongAttempt1.status).toBe(400);
    const wrongAttempt2 = await request(app)
      .post(`/api/orgs/${orgSlug}/otp/verify`)
      .send({ mobile, code: "111111" });
    expect(wrongAttempt2.status).toBe(400);

    const correctAttempt = await request(app)
      .post(`/api/orgs/${orgSlug}/otp/verify`)
      .send({ mobile, code: correctCode });
    expect(correctAttempt.status).toBe(200);
    expect(correctAttempt.body.sessionToken).toBeTruthy();
  });

  it("rejects a verify against an expired OTP", async () => {
    const mobile = "9444444444";
    const send = await request(app).post(`/api/orgs/${orgSlug}/otp/send`).send({ mobile });
    const code = send.body.devOtp as string;

    await prisma.otpVerification.updateMany({
      where: { organizationId: orgId, mobileNumber: mobile },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const res = await request(app).post(`/api/orgs/${orgSlug}/otp/verify`).send({ mobile, code });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/expired/i);
  });

  it("new mobile number: no existing patient match, blank details", async () => {
    const mobile = "9555555555";
    const send = await request(app).post(`/api/orgs/${orgSlug}/otp/send`).send({ mobile });
    const verify = await request(app)
      .post(`/api/orgs/${orgSlug}/otp/verify`)
      .send({ mobile, code: send.body.devOtp });

    expect(verify.status).toBe(200);
    expect(verify.body.isExistingPatient).toBe(false);
    expect(verify.body.patient.name).toBeNull();
  });

  it("repeat mobile number: matches the existing patient and pre-fills their saved details", async () => {
    const mobile = MOBILE;

    // First-ever verification for this mobile — no match yet, then the patient fills in details.
    const firstSend = await request(app).post(`/api/orgs/${orgSlug}/otp/send`).send({ mobile });
    const firstVerify = await request(app)
      .post(`/api/orgs/${orgSlug}/otp/verify`)
      .send({ mobile, code: firstSend.body.devOtp });
    expect(firstVerify.body.isExistingPatient).toBe(false);

    const sessionToken = firstVerify.body.sessionToken as string;
    await request(app)
      .post(`/api/patient-session/${sessionToken}/details`)
      .send({ name: "Asha Rao", dobOrAge: "34", gender: "FEMALE" });

    // Simulate a brand new booking session later — same mobile, fresh OTP cycle.
    await prisma.otpVerification.updateMany({
      where: { organizationId: orgId, mobileNumber: mobile },
      data: { createdAt: new Date(Date.now() - (OTP_RESEND_COOLDOWN_SECONDS + 1) * 1000) },
    });
    const secondSend = await request(app).post(`/api/orgs/${orgSlug}/otp/send`).send({ mobile });
    const secondVerify = await request(app)
      .post(`/api/orgs/${orgSlug}/otp/verify`)
      .send({ mobile, code: secondSend.body.devOtp });

    expect(secondVerify.status).toBe(200);
    expect(secondVerify.body.isExistingPatient).toBe(true);
    expect(secondVerify.body.patient.name).toBe("Asha Rao");
    expect(secondVerify.body.patient.gender).toBe("FEMALE");
  });
});
