import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app, cleanupOrg, createLabTest, createRadiologyExam, createTestOrg } from "./helpers";

describe("cart engine", () => {
  let orgA: { id: string; slug: string };
  let orgB: { id: string; slug: string };
  let examAId: string;
  let testAId: string;
  let examBId: string;

  beforeAll(async () => {
    const a = await createTestOrg("cart-a");
    const b = await createTestOrg("cart-b");
    orgA = { id: a.id, slug: a.slug };
    orgB = { id: b.id, slug: b.slug };

    examAId = (await createRadiologyExam(orgA.id, { name: "MRI Brain Plain" })).id;
    testAId = (await createLabTest(orgA.id, { name: "Lipid Profile" })).id;
    examBId = (await createRadiologyExam(orgB.id, { name: "CT Chest Plain" })).id;
  });

  afterAll(async () => {
    await cleanupOrg(orgA.id);
    await cleanupOrg(orgB.id);
  });

  async function newCartToken(orgSlug: string): Promise<string> {
    const res = await request(app).post("/api/cart").send({ orgSlug });
    expect(res.status).toBe(201);
    return res.body.token as string;
  }

  it("creates an empty cart with cartType null", async () => {
    const token = await newCartToken(orgA.slug);
    const res = await request(app).get(`/api/cart/${token}`);
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.cartType).toBeNull();
  });

  it("auto-flips cartType to COMBINED once both item types are present, and flips back on removal", async () => {
    const token = await newCartToken(orgA.slug);

    const afterExam = await request(app)
      .post(`/api/cart/${token}/items`)
      .send({ itemType: "RADIOLOGY_EXAM", itemId: examAId });
    expect(afterExam.status).toBe(201);
    expect(afterExam.body.cartType).toBe("RADIOLOGY");

    const afterTest = await request(app)
      .post(`/api/cart/${token}/items`)
      .send({ itemType: "LAB_TEST", itemId: testAId });
    expect(afterTest.status).toBe(201);
    expect(afterTest.body.cartType).toBe("COMBINED");

    const labItem = afterTest.body.items.find(
      (item: { itemType: string }) => item.itemType === "LAB_TEST",
    );
    const afterRemove = await request(app).delete(`/api/cart/${token}/items/${labItem.id}`);
    expect(afterRemove.status).toBe(200);
    expect(afterRemove.body.cartType).toBe("RADIOLOGY");
  });

  it("rejects an item that belongs to a different organization", async () => {
    const token = await newCartToken(orgA.slug);
    const res = await request(app)
      .post(`/api/cart/${token}/items`)
      .send({ itemType: "RADIOLOGY_EXAM", itemId: examBId });
    expect(res.status).toBe(400);
  });

  it("shows a directional nudge with one item type, and hides it once combined", async () => {
    const token = await newCartToken(orgA.slug);

    await request(app)
      .post(`/api/cart/${token}/items`)
      .send({ itemType: "RADIOLOGY_EXAM", itemId: examAId });
    const nudgeWithOneType = await request(app).get(`/api/cart/${token}/nudge`);
    expect(nudgeWithOneType.body).toEqual({ showNudge: true, direction: "SUGGEST_LAB" });

    await request(app)
      .post(`/api/cart/${token}/items`)
      .send({ itemType: "LAB_TEST", itemId: testAId });
    const nudgeWhenCombined = await request(app).get(`/api/cart/${token}/nudge`);
    expect(nudgeWhenCombined.body).toEqual({ showNudge: false, direction: null });
  });

  it("is not ready for checkout while empty, and becomes ready once an item is added", async () => {
    const token = await newCartToken(orgA.slug);

    const beforeAdd = await request(app).get(`/api/cart/${token}/ready-for-checkout`);
    expect(beforeAdd.body.ready).toBe(false);

    await request(app)
      .post(`/api/cart/${token}/items`)
      .send({ itemType: "RADIOLOGY_EXAM", itemId: examAId });
    const afterAdd = await request(app).get(`/api/cart/${token}/ready-for-checkout`);
    expect(afterAdd.body.ready).toBe(true);
  });
});
