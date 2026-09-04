import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { prisma } from "@rlap/db";
import {
  app,
  cleanupOrg,
  createCentre,
  createLabTest,
  createServiceableArea,
  createSlot,
  createTestOrg,
  linkCentreLabTest,
} from "./helpers";

/**
 * Regression coverage for a real bug found while walking the four happy paths (§3.3): a
 * home-collection cart never got a `cart.centreId` set anywhere (L5a has no centre picker —
 * home collection is meant to be centre-agnostic from the patient's side), yet Slot listing,
 * the booking summary, and confirmBooking all unconditionally require one — so a Lab-only
 * Home Collection booking could never actually be confirmed. Fixed by resolving a dispatching
 * centre silently from the matched ServiceableArea + which centre offers the cart's tests.
 * This test walks the full flow through the real HTTP API to prove it now completes.
 */
describe("e2e: lab-only home-collection booking, cart to confirmed", () => {
  let orgSlug: string;
  let orgId: string;
  let testId: string;
  let centreId: string;
  let collectionSlotId: string;

  beforeAll(async () => {
    const org = await createTestOrg("e2e-home-collection");
    orgSlug = org.slug;
    orgId = org.id;

    testId = (
      await createLabTest(orgId, {
        name: "Lipid Profile",
        price: 700,
        homeCollectionEligible: true,
      })
    ).id;
    centreId = (
      await createCentre(orgId, {
        name: "Home Collection Centre",
        offersLab: true,
        offersRadiology: false,
      })
    ).id;
    await linkCentreLabTest(centreId, testId);
    await createServiceableArea(orgId, { pinCode: "500016", homeCollectionCharge: 150 });

    collectionSlotId = (
      await createSlot(centreId, {
        type: "HOME_COLLECTION_WINDOW",
        startTime: new Date(Date.UTC(1970, 0, 1, 7, 0)),
        endTime: new Date(Date.UTC(1970, 0, 1, 8, 0)),
      })
    ).id;
  });

  afterAll(async () => cleanupOrg(orgId));

  it("resolves a dispatching centre and completes the booking end to end", async () => {
    const cartRes = await request(app).post("/api/cart").send({ orgSlug });
    const token = cartRes.body.token as string;
    await request(app)
      .post(`/api/cart/${token}/items`)
      .send({ itemType: "LAB_TEST", itemId: testId });

    const addressRes = await request(app)
      .post(`/api/cart/${token}/home-collection/address`)
      .send({ pinCode: "500016", houseNumber: "12B", street: "Main Road" });
    expect(addressRes.status).toBe(201);
    // The bug: this used to be null, and every downstream step failed as a result.
    expect(addressRes.body.centreId).toBe(centreId);

    const slot = await prisma.slot.findUniqueOrThrow({ where: { id: collectionSlotId } });
    const dateStr = slot.date.toISOString().slice(0, 10);
    const slotsForDate = await request(app).get(
      `/api/cart/${token}/slots?centreId=${centreId}&date=${dateStr}`,
    );
    expect(slotsForDate.body.lab.map((s: { id: string }) => s.id)).toContain(collectionSlotId);

    const hold = await request(app)
      .post(`/api/cart/${token}/slots/hold`)
      .send({ slotId: collectionSlotId });
    expect(hold.status).toBe(201);

    const mobile = "9812345000";
    const sendOtp = await request(app).post(`/api/orgs/${orgSlug}/otp/send`).send({ mobile });
    const verifyOtp = await request(app)
      .post(`/api/orgs/${orgSlug}/otp/verify`)
      .send({ mobile, code: sendOtp.body.devOtp, cartToken: token });
    expect(verifyOtp.status).toBe(200);

    await request(app)
      .post(`/api/patient-session/${verifyOtp.body.sessionToken}/details`)
      .send({ name: "Home Collection Test Patient", dobOrAge: "33", gender: "FEMALE" });

    const summary = await request(app).get(`/api/cart/${token}/summary`);
    expect(summary.body.centre.id).toBe(centreId);
    expect(summary.body.homeCollectionCharge).toBe(150);

    const confirmRes = await request(app)
      .post(`/api/cart/${token}/confirm`)
      .send({ paymentMethod: "PAY_AT_RECEPTION" });
    expect(confirmRes.status).toBe(201);
    expect(confirmRes.body.status).toBe("CONFIRMED");

    const booking = await prisma.booking.findUniqueOrThrow({
      where: { id: confirmRes.body.bookingId },
    });
    expect(booking.centreId).toBe(centreId);
    expect(booking.collectionMode).toBe("HOME_COLLECTION");
  });
});
