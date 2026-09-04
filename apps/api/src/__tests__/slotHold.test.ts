import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { prisma } from "@rlap/db";
import { sweepExpiredHolds } from "../cart/slotHoldSweeper";
import {
  app,
  cleanupOrg,
  createCentre,
  createRadiologyExam,
  createSlot,
  createTestOrg,
  linkCentreRadiologyExam,
} from "./helpers";

describe("slot holds", () => {
  let orgSlug: string;
  let orgId: string;
  let centreId: string;
  let examId: string;

  beforeAll(async () => {
    const org = await createTestOrg("slot-hold");
    orgSlug = org.slug;
    orgId = org.id;

    examId = (await createRadiologyExam(orgId, { name: "MRI Brain Plain" })).id;
    centreId = (
      await createCentre(orgId, { name: "Centre", offersRadiology: true, offersLab: false })
    ).id;
    await linkCentreRadiologyExam(centreId, examId);
  });

  afterAll(async () => {
    await cleanupOrg(orgId);
  });

  async function newCartWithExam(): Promise<string> {
    const createRes = await request(app).post("/api/cart").send({ orgSlug });
    const token = createRes.body.token as string;
    await request(app)
      .post(`/api/cart/${token}/items`)
      .send({ itemType: "RADIOLOGY_EXAM", itemId: examId });
    return token;
  }

  // Each test gets its own single-seat slot(s) so one test's still-active (real, ~10-minute)
  // hold can never exhaust capacity for a later, unrelated test.
  async function newSingleSeatSlot(hour: number) {
    return createSlot(centreId, {
      type: "RADIOLOGY",
      startTime: new Date(Date.UTC(1970, 0, 1, hour, 0)),
      capacity: 1,
    });
  }

  it("holds a slot and reports the remaining time via hold-status", async () => {
    const token = await newCartWithExam();
    const slot = await newSingleSeatSlot(6);

    const hold = await request(app).post(`/api/cart/${token}/slots/hold`).send({ slotId: slot.id });
    expect(hold.status).toBe(201);
    expect(hold.body.holdDurationSeconds).toBe(600);

    const status = await request(app).get(`/api/cart/${token}/hold-status`);
    expect(status.body.expired).toBe(false);
    expect(status.body.remainingSeconds).toBeGreaterThan(590);
    expect(status.body.remainingSeconds).toBeLessThanOrEqual(600);
  });

  it("re-holding the SAME slot extends the hold instead of stacking a second row", async () => {
    const token = await newCartWithExam();
    const slot = await newSingleSeatSlot(7);

    const first = await request(app)
      .post(`/api/cart/${token}/slots/hold`)
      .send({ slotId: slot.id });
    expect(first.status).toBe(201);
    const second = await request(app)
      .post(`/api/cart/${token}/slots/hold`)
      .send({ slotId: slot.id });
    expect(second.status).toBe(201);

    const holds = await prisma.slotHold.findMany({ where: { cartToken: token, slotId: slot.id } });
    expect(holds).toHaveLength(1);
  });

  it("re-selecting a DIFFERENT slot of the same type replaces the old hold, releasing its capacity", async () => {
    const cartA = await newCartWithExam();
    const slotA = await newSingleSeatSlot(8);
    const slotB = await newSingleSeatSlot(9);

    const firstHold = await request(app)
      .post(`/api/cart/${cartA}/slots/hold`)
      .send({ slotId: slotA.id });
    expect(firstHold.status).toBe(201);

    // Cart A changes its mind and holds slot B instead.
    const moveHold = await request(app)
      .post(`/api/cart/${cartA}/slots/hold`)
      .send({ slotId: slotB.id });
    expect(moveHold.status).toBe(201);

    const cartAHolds = await prisma.slotHold.findMany({ where: { cartToken: cartA } });
    expect(cartAHolds.map((h) => h.slotId)).toEqual([slotB.id]);

    // Slot A (capacity 1) must now be free for a different cart to hold.
    const cartB = await newCartWithExam();
    const cartBHold = await request(app)
      .post(`/api/cart/${cartB}/slots/hold`)
      .send({ slotId: slotA.id });
    expect(cartBHold.status).toBe(201);
  });

  it("a full slot rejects a second cart's hold with 409", async () => {
    const cartA = await newCartWithExam();
    const cartB = await newCartWithExam();
    const slot = await newSingleSeatSlot(10);

    const first = await request(app)
      .post(`/api/cart/${cartA}/slots/hold`)
      .send({ slotId: slot.id });
    expect(first.status).toBe(201);

    const second = await request(app)
      .post(`/api/cart/${cartB}/slots/hold`)
      .send({ slotId: slot.id });
    expect(second.status).toBe(409);
  });

  it("an expired hold no longer counts against capacity, even before the sweeper runs", async () => {
    const cartA = await newCartWithExam();
    const cartB = await newCartWithExam();
    const slot = await newSingleSeatSlot(12);

    const held = await request(app).post(`/api/cart/${cartA}/slots/hold`).send({ slotId: slot.id });
    expect(held.status).toBe(201);

    // Force cart A's hold into the past instead of waiting 10 real minutes.
    await prisma.slotHold.updateMany({
      where: { cartToken: cartA, slotId: slot.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const status = await request(app).get(`/api/cart/${cartA}/hold-status`);
    expect(status.body.expired).toBe(true);

    const cartBHold = await request(app)
      .post(`/api/cart/${cartB}/slots/hold`)
      .send({ slotId: slot.id });
    expect(cartBHold.status).toBe(201);
  });

  it("the sweeper deletes expired hold rows outright", async () => {
    const token = await newCartWithExam();
    const slot = await newSingleSeatSlot(14);

    const held = await request(app).post(`/api/cart/${token}/slots/hold`).send({ slotId: slot.id });
    expect(held.status).toBe(201);

    await prisma.slotHold.updateMany({
      where: { cartToken: token, slotId: slot.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const deletedCount = await sweepExpiredHolds();
    expect(deletedCount).toBeGreaterThanOrEqual(1);

    const remaining = await prisma.slotHold.findMany({
      where: { cartToken: token, slotId: slot.id },
    });
    expect(remaining).toHaveLength(0);
  });
});
