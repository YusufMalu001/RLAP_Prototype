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

/**
 * The spec's central end-to-end claim (§5.4): "Exactly one booking confirmation is generated
 * for the combined booking, never two." This walks a full Combined booking — radiology + lab,
 * MRI safety check, OTP identification, mocked online payment — through the real HTTP API and
 * asserts exactly one Booking row lands, with the correct line items and slots attached.
 */
describe("e2e: combined booking, cart to confirmed", () => {
  let orgSlug: string;
  let orgId: string;
  let examId: string;
  let testId: string;
  let centreId: string;
  let radiologySlotId: string;
  let labSlotId: string;

  beforeAll(async () => {
    const org = await createTestOrg("e2e-combined");
    orgSlug = org.slug;
    orgId = org.id;

    examId = (await createRadiologyExam(orgId, { name: "MRI Brain Plain", price: 6500 })).id;
    testId = (await createLabTest(orgId, { name: "Lipid Profile", price: 700 })).id;
    centreId = (
      await createCentre(orgId, { name: "E2E Centre", offersRadiology: true, offersLab: true })
    ).id;
    await linkCentreRadiologyExam(centreId, examId);
    await linkCentreLabTest(centreId, testId);

    radiologySlotId = (
      await createSlot(centreId, {
        type: "RADIOLOGY",
        startTime: new Date(Date.UTC(1970, 0, 1, 9, 0)),
      })
    ).id;
    labSlotId = (
      await createSlot(centreId, { type: "LAB", startTime: new Date(Date.UTC(1970, 0, 1, 7, 0)) })
    ).id;
  });

  afterAll(async () => {
    await cleanupOrg(orgId);
  });

  it("runs cart -> centre -> safety check -> holds -> OTP -> details -> confirm -> pay -> confirmed, creating exactly one Booking", async () => {
    // 1. Cart + combined items
    const cartRes = await request(app).post("/api/cart").send({ orgSlug });
    expect(cartRes.status).toBe(201);
    const token = cartRes.body.token as string;

    await request(app)
      .post(`/api/cart/${token}/items`)
      .send({ itemType: "RADIOLOGY_EXAM", itemId: examId });
    const afterLab = await request(app)
      .post(`/api/cart/${token}/items`)
      .send({ itemType: "LAB_TEST", itemId: testId });
    expect(afterLab.body.cartType).toBe("COMBINED");

    // 2. Centre selection — the critical combined-match rule from an earlier phase
    const centres = await request(app).get(`/api/cart/${token}/centres`);
    expect(centres.body.centres.map((c: { id: string }) => c.id)).toContain(centreId);
    const setCentre = await request(app).post(`/api/cart/${token}/centre`).send({ centreId });
    expect(setCentre.status).toBe(200);

    // 3. Safety check (MRI in cart) — all-clear so the online flow can proceed
    const required = await request(app).get(`/api/cart/${token}/safety-check-required`);
    expect(required.body.safetyCheckRequired).toBe(true);
    const safetyCheck = await request(app)
      .post(`/api/cart/${token}/safety-check`)
      .send({ answers: { PREGNANCY: false, PACEMAKER: false, IMPLANTS: false, ALLERGIES: false } });
    expect(safetyCheck.body.flagged).toBe(false);

    // 4. Dual slot holds
    const holdRadiology = await request(app)
      .post(`/api/cart/${token}/slots/hold`)
      .send({ slotId: radiologySlotId });
    expect(holdRadiology.status).toBe(201);
    const holdLab = await request(app)
      .post(`/api/cart/${token}/slots/hold`)
      .send({ slotId: labSlotId });
    expect(holdLab.status).toBe(201);

    // 5. OTP identification, linked to this cart
    const mobile = "9123456789";
    const sendOtp = await request(app).post(`/api/orgs/${orgSlug}/otp/send`).send({ mobile });
    const verifyOtp = await request(app)
      .post(`/api/orgs/${orgSlug}/otp/verify`)
      .send({ mobile, code: sendOtp.body.devOtp, cartToken: token });
    expect(verifyOtp.status).toBe(200);
    expect(verifyOtp.body.isExistingPatient).toBe(false);
    const sessionToken = verifyOtp.body.sessionToken as string;

    const cartAfterOtp = await request(app).get(`/api/cart/${token}`);
    expect(cartAfterOtp.body.patientId).toBeTruthy();

    // 6. Patient details
    const detailsRes = await request(app)
      .post(`/api/patient-session/${sessionToken}/details`)
      .send({ name: "Combined Test Patient", dobOrAge: "29", gender: "FEMALE" });
    expect(detailsRes.status).toBe(200);

    // 7. Summary — two schedule entries for Combined
    const summary = await request(app).get(`/api/cart/${token}/summary`);
    expect(summary.body.items).toHaveLength(2);
    expect(summary.body.schedule).toHaveLength(2);
    expect(summary.body.subtotal).toBe(7200);
    expect(summary.body.patientName).toBe("Combined Test Patient");

    // 8. Confirm with online payment -> PENDING_PAYMENT, cart consumed
    const confirmRes = await request(app)
      .post(`/api/cart/${token}/confirm`)
      .send({ paymentMethod: "ONLINE" });
    expect(confirmRes.status).toBe(201);
    expect(confirmRes.body.status).toBe("PENDING_PAYMENT");
    const bookingId = confirmRes.body.bookingId as string;

    expect(await prisma.booking.count({ where: { organizationId: orgId } })).toBe(1);

    // 9. Pay -> CONFIRMED
    const payRes = await request(app).post(`/api/bookings/${bookingId}/pay`).send({});
    expect(payRes.status).toBe(200);
    expect(payRes.body.success).toBe(true);
    expect(payRes.body.status).toBe("CONFIRMED");

    // 10. Full detail
    const detail = await request(app).get(`/api/bookings/${bookingId}`);
    expect(detail.body.status).toBe("CONFIRMED");
    expect(detail.body.type).toBe("COMBINED");
    expect(detail.body.lineItems).toHaveLength(2);
    expect(detail.body.schedule).toHaveLength(2);
    expect(detail.body.centre.id).toBe(centreId);
    expect(detail.body.patient.name).toBe("Combined Test Patient");

    // 11. Exactly one Booking row, with exactly one line item per service and one slot per type
    expect(await prisma.booking.count({ where: { organizationId: orgId } })).toBe(1);
    expect(await prisma.bookingLineItem.count({ where: { bookingId } })).toBe(2);
    expect(await prisma.bookingSlot.count({ where: { bookingId } })).toBe(2);

    // 12. Holds released, capacity converted to real bookedCount
    expect(await prisma.slotHold.count({ where: { cartToken: token } })).toBe(0);
    const radiologySlot = await prisma.slot.findUniqueOrThrow({ where: { id: radiologySlotId } });
    const labSlot = await prisma.slot.findUniqueOrThrow({ where: { id: labSlotId } });
    expect(radiologySlot.bookedCount).toBe(1);
    expect(labSlot.bookedCount).toBe(1);

    // 13. Notifications fired on confirmation
    const notifications = await prisma.sentNotification.findMany({ where: { bookingId } });
    expect(notifications.some((n) => n.channel === "SMS")).toBe(true);

    // 14. Double-submit guard: the cart is gone, so a second /confirm can't create a second Booking
    const secondConfirm = await request(app)
      .post(`/api/cart/${token}/confirm`)
      .send({ paymentMethod: "ONLINE" });
    expect(secondConfirm.status).toBe(404);
    expect(await prisma.booking.count({ where: { organizationId: orgId } })).toBe(1);
  });
});
