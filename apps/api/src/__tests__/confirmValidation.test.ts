import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { prisma } from "@rlap/db";
import {
  app,
  cleanupOrg,
  createCentre,
  createLabTest,
  createRadiologyExam,
  createSlot,
  createTestOrg,
  linkCentreLabTest,
  linkCentreRadiologyExam,
} from "./helpers";

describe("POST /api/cart/:token/confirm validation", () => {
  let orgSlug: string;
  let orgId: string;
  let eligibleTestId: string;
  let ineligibleExamId: string;
  let centreId: string;
  let slotId: string;

  beforeAll(async () => {
    const org = await createTestOrg("confirm-validation");
    orgSlug = org.slug;
    orgId = org.id;

    eligibleTestId = (await createLabTest(orgId, { name: "CBC", price: 350 })).id;
    // requiresSafetyCheck defaults true via the helper — reused below for the safety-gate cases.
    ineligibleExamId = (await createRadiologyExam(orgId, { name: "MRI Knee", price: 6800 })).id;
    centreId = (
      await createCentre(orgId, {
        name: "Validation Centre",
        offersRadiology: true,
        offersLab: true,
      })
    ).id;
    await linkCentreLabTest(centreId, eligibleTestId);
    await linkCentreRadiologyExam(centreId, ineligibleExamId);

    // Generous capacity: several tests in this file hold this same slot and never release it
    // (that's incidental to what each test actually checks) — capacity contention here would
    // just be test coupling, not the thing under test (see slotHold.test.ts for that).
    slotId = (
      await createSlot(centreId, {
        type: "LAB",
        startTime: new Date(Date.UTC(1970, 0, 1, 8, 0)),
        capacity: 10,
      })
    ).id;
  });

  afterAll(async () => {
    await cleanupOrg(orgId);
  });

  async function cartWithLabItem(): Promise<string> {
    const cartRes = await request(app).post("/api/cart").send({ orgSlug });
    const token = cartRes.body.token as string;
    await request(app)
      .post(`/api/cart/${token}/items`)
      .send({ itemType: "LAB_TEST", itemId: eligibleTestId });
    return token;
  }

  it("rejects confirm on an empty cart", async () => {
    const cartRes = await request(app).post("/api/cart").send({ orgSlug });
    const token = cartRes.body.token as string;
    const res = await request(app)
      .post(`/api/cart/${token}/confirm`)
      .send({ paymentMethod: "ONLINE" });
    expect(res.status).toBe(400);
  });

  it("rejects confirm when no centre has been selected", async () => {
    const token = await cartWithLabItem();

    // Identify the patient first so centre selection is the ONLY missing precondition —
    // otherwise both checks would be true and whichever the code checks first would "win".
    const mobile = "9345612344";
    const send = await request(app).post(`/api/orgs/${orgSlug}/otp/send`).send({ mobile });
    await request(app)
      .post(`/api/orgs/${orgSlug}/otp/verify`)
      .send({ mobile, code: send.body.devOtp, cartToken: token });

    const res = await request(app)
      .post(`/api/cart/${token}/confirm`)
      .send({ paymentMethod: "ONLINE" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/centre/i);
  });

  it("rejects confirm when the patient has not been identified", async () => {
    const token = await cartWithLabItem();
    await request(app).post(`/api/cart/${token}/centre`).send({ centreId });
    await request(app).post(`/api/cart/${token}/slots/hold`).send({ slotId });

    const res = await request(app)
      .post(`/api/cart/${token}/confirm`)
      .send({ paymentMethod: "ONLINE" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/patient/i);
  });

  it("rejects confirm when the slot hold has expired", async () => {
    const token = await cartWithLabItem();
    await request(app).post(`/api/cart/${token}/centre`).send({ centreId });
    await request(app).post(`/api/cart/${token}/slots/hold`).send({ slotId });

    // Identify the patient so the hold check is the thing actually under test.
    const mobile = "9345612345";
    const send = await request(app).post(`/api/orgs/${orgSlug}/otp/send`).send({ mobile });
    await request(app)
      .post(`/api/orgs/${orgSlug}/otp/verify`)
      .send({ mobile, code: send.body.devOtp, cartToken: token });

    await prisma.slotHold.updateMany({
      where: { cartToken: token },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const res = await request(app)
      .post(`/api/cart/${token}/confirm`)
      .send({ paymentMethod: "ONLINE" });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/hold/i);
  });

  it("rejects confirm when a required safety check has not been submitted", async () => {
    const cartRes = await request(app).post("/api/cart").send({ orgSlug });
    const token = cartRes.body.token as string;
    await request(app)
      .post(`/api/cart/${token}/items`)
      .send({ itemType: "RADIOLOGY_EXAM", itemId: ineligibleExamId });
    await request(app).post(`/api/cart/${token}/centre`).send({ centreId });

    const radiologySlot = await createSlot(centreId, {
      type: "RADIOLOGY",
      startTime: new Date(Date.UTC(1970, 0, 1, 10, 0)),
    });
    await request(app).post(`/api/cart/${token}/slots/hold`).send({ slotId: radiologySlot.id });

    const mobile = "9345612346";
    const send = await request(app).post(`/api/orgs/${orgSlug}/otp/send`).send({ mobile });
    await request(app)
      .post(`/api/orgs/${orgSlug}/otp/verify`)
      .send({ mobile, code: send.body.devOtp, cartToken: token });

    const res = await request(app)
      .post(`/api/cart/${token}/confirm`)
      .send({ paymentMethod: "ONLINE" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/safety/i);
  });

  it("rejects confirm when a flagged safety check blocks the booking", async () => {
    const cartRes = await request(app).post("/api/cart").send({ orgSlug });
    const token = cartRes.body.token as string;
    await request(app)
      .post(`/api/cart/${token}/items`)
      .send({ itemType: "RADIOLOGY_EXAM", itemId: ineligibleExamId });
    await request(app).post(`/api/cart/${token}/centre`).send({ centreId });

    const radiologySlot = await createSlot(centreId, {
      type: "RADIOLOGY",
      startTime: new Date(Date.UTC(1970, 0, 1, 12, 0)),
    });
    await request(app).post(`/api/cart/${token}/slots/hold`).send({ slotId: radiologySlot.id });

    const mobile = "9345612347";
    const send = await request(app).post(`/api/orgs/${orgSlug}/otp/send`).send({ mobile });
    await request(app)
      .post(`/api/orgs/${orgSlug}/otp/verify`)
      .send({ mobile, code: send.body.devOtp, cartToken: token });

    await request(app)
      .post(`/api/cart/${token}/safety-check`)
      .send({ answers: { PREGNANCY: false, PACEMAKER: true, IMPLANTS: false, ALLERGIES: false } });

    const res = await request(app)
      .post(`/api/cart/${token}/confirm`)
      .send({ paymentMethod: "ONLINE" });
    expect(res.status).toBe(409);
    expect(await prisma.booking.count({ where: { organizationId: orgId } })).toBe(0);
  });

  it("rejects PAY_AT_RECEPTION when a cart item is prepaid-only (mixed-cart rule)", async () => {
    const cartRes = await request(app).post("/api/cart").send({ orgSlug });
    const token = cartRes.body.token as string;
    const prepaidOnlyExam = (
      await createRadiologyExam(orgId, { name: "MRI Prepaid Only", price: 6000 })
    ).id;
    await prisma.radiologyExam.update({
      where: { id: prepaidOnlyExam },
      data: { payAtReceptionEligible: false, requiresSafetyCheck: false },
    });
    await linkCentreRadiologyExam(centreId, prepaidOnlyExam);

    await request(app)
      .post(`/api/cart/${token}/items`)
      .send({ itemType: "RADIOLOGY_EXAM", itemId: prepaidOnlyExam });
    await request(app)
      .post(`/api/cart/${token}/items`)
      .send({ itemType: "LAB_TEST", itemId: eligibleTestId });
    await request(app).post(`/api/cart/${token}/centre`).send({ centreId });

    const summary = await request(app).get(`/api/cart/${token}/summary`);
    expect(summary.body.payAtReceptionEligible).toBe(false);

    const res = await request(app)
      .post(`/api/cart/${token}/confirm`)
      .send({ paymentMethod: "PAY_AT_RECEPTION" });
    expect(res.status).toBe(400);
  });

  it("confirms immediately (status CONFIRMED, no /pay needed) for an eligible reception booking", async () => {
    const token = await cartWithLabItem();
    await request(app).post(`/api/cart/${token}/centre`).send({ centreId });
    await request(app).post(`/api/cart/${token}/slots/hold`).send({ slotId });

    const mobile = "9345612348";
    const send = await request(app).post(`/api/orgs/${orgSlug}/otp/send`).send({ mobile });
    await request(app)
      .post(`/api/orgs/${orgSlug}/otp/verify`)
      .send({ mobile, code: send.body.devOtp, cartToken: token });

    const summary = await request(app).get(`/api/cart/${token}/summary`);
    expect(summary.body.payAtReceptionEligible).toBe(true);

    const res = await request(app)
      .post(`/api/cart/${token}/confirm`)
      .send({ paymentMethod: "PAY_AT_RECEPTION" });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("CONFIRMED");
    expect(res.body.paymentIntent).toBeUndefined();
  });
});
