import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import {
  app,
  cleanupOrg,
  createCentre,
  createLabTest,
  createRadiologyExam,
  createServiceableArea,
  createTestOrg,
  linkCentreLabTest,
  linkCentreRadiologyExam,
} from "./helpers";

describe("GET /api/cart/:token/centres", () => {
  let orgSlug: string;
  let orgId: string;
  let examMri: string;
  let testLipid: string;
  let testCbc: string;
  let centreBoth: string;
  let centreLabOnly: string;

  beforeAll(async () => {
    const org = await createTestOrg("cart-centres");
    orgSlug = org.slug;
    orgId = org.id;

    examMri = (await createRadiologyExam(orgId, { name: "MRI Brain Plain" })).id;
    testLipid = (await createLabTest(orgId, { name: "Lipid Profile" })).id;
    testCbc = (await createLabTest(orgId, { name: "CBC" })).id;

    centreBoth = (
      await createCentre(orgId, { name: "Centre Both", offersRadiology: true, offersLab: true })
    ).id;
    centreLabOnly = (
      await createCentre(orgId, {
        name: "Centre Lab Only",
        offersRadiology: false,
        offersLab: true,
      })
    ).id;

    await linkCentreRadiologyExam(centreBoth, examMri);
    await linkCentreLabTest(centreBoth, testLipid);
    await linkCentreLabTest(centreBoth, testCbc);
    await linkCentreLabTest(centreLabOnly, testLipid);
    await linkCentreLabTest(centreLabOnly, testCbc);
  });

  afterAll(async () => {
    await cleanupOrg(orgId);
  });

  async function newCartToken(): Promise<string> {
    const res = await request(app).post("/api/cart").send({ orgSlug });
    return res.body.token as string;
  }

  it("returns [] for a freshly created (empty) cart", async () => {
    const token = await newCartToken();
    const res = await request(app).get(`/api/cart/${token}/centres`);
    expect(res.status).toBe(200);
    expect(res.body.centres).toEqual([]);
  });

  it("RADIOLOGY cart matches centres offering the exam, regardless of lab coverage", async () => {
    const token = await newCartToken();
    await request(app)
      .post(`/api/cart/${token}/items`)
      .send({ itemType: "RADIOLOGY_EXAM", itemId: examMri });

    const res = await request(app).get(`/api/cart/${token}/centres`);
    const ids = res.body.centres.map((c: { id: string }) => c.id);
    expect(ids).toEqual([centreBoth]);
  });

  it("LAB cart (default collection mode) matches centres offering every lab item", async () => {
    const token = await newCartToken();
    await request(app)
      .post(`/api/cart/${token}/items`)
      .send({ itemType: "LAB_TEST", itemId: testLipid });
    await request(app)
      .post(`/api/cart/${token}/items`)
      .send({ itemType: "LAB_TEST", itemId: testCbc });

    const res = await request(app).get(`/api/cart/${token}/centres`);
    const ids = res.body.centres.map((c: { id: string }) => c.id);
    expect(ids.sort()).toEqual([centreBoth, centreLabOnly].sort());
  });

  it("COMBINED cart only matches the centre offering both the exam and every lab item", async () => {
    const token = await newCartToken();
    await request(app)
      .post(`/api/cart/${token}/items`)
      .send({ itemType: "RADIOLOGY_EXAM", itemId: examMri });
    await request(app)
      .post(`/api/cart/${token}/items`)
      .send({ itemType: "LAB_TEST", itemId: testLipid });
    await request(app)
      .post(`/api/cart/${token}/items`)
      .send({ itemType: "LAB_TEST", itemId: testCbc });

    const res = await request(app).get(`/api/cart/${token}/centres`);
    const ids = res.body.centres.map((c: { id: string }) => c.id);
    expect(ids).toEqual([centreBoth]);
  });
});

describe("POST /api/cart/:token/centre", () => {
  let orgSlug: string;
  let orgId: string;
  let examMri: string;
  let testLipid: string;
  let centreBoth: string;
  let centreRadiologyOnly: string;

  beforeAll(async () => {
    const org = await createTestOrg("cart-centre-set");
    orgSlug = org.slug;
    orgId = org.id;
    examMri = (await createRadiologyExam(orgId, { name: "MRI Brain Plain" })).id;
    testLipid = (await createLabTest(orgId, { name: "Lipid Profile" })).id;
    centreBoth = (
      await createCentre(orgId, { name: "Centre Both", offersRadiology: true, offersLab: true })
    ).id;
    centreRadiologyOnly = (
      await createCentre(orgId, {
        name: "Centre Radiology Only",
        offersRadiology: true,
        offersLab: false,
      })
    ).id;
    await linkCentreRadiologyExam(centreBoth, examMri);
    await linkCentreLabTest(centreBoth, testLipid);
    await linkCentreRadiologyExam(centreRadiologyOnly, examMri);
  });

  afterAll(async () => {
    await cleanupOrg(orgId);
  });

  it("accepts a centre that satisfies the current combined cart, rejects one that doesn't", async () => {
    const createRes = await request(app).post("/api/cart").send({ orgSlug });
    const token = createRes.body.token as string;
    await request(app)
      .post(`/api/cart/${token}/items`)
      .send({ itemType: "RADIOLOGY_EXAM", itemId: examMri });
    await request(app)
      .post(`/api/cart/${token}/items`)
      .send({ itemType: "LAB_TEST", itemId: testLipid });

    const rejected = await request(app)
      .post(`/api/cart/${token}/centre`)
      .send({ centreId: centreRadiologyOnly });
    expect(rejected.status).toBe(400);

    const accepted = await request(app)
      .post(`/api/cart/${token}/centre`)
      .send({ centreId: centreBoth });
    expect(accepted.status).toBe(200);
    expect(accepted.body.centreId).toBe(centreBoth);
  });
});

describe("safety check", () => {
  let orgSlug: string;
  let orgId: string;
  let mriExam: string;
  let xrayExam: string;

  beforeAll(async () => {
    const org = await createTestOrg("safety");
    orgSlug = org.slug;
    orgId = org.id;
    mriExam = (
      await createRadiologyExam(orgId, { name: "MRI Brain Plain", requiresSafetyCheck: true })
    ).id;
    xrayExam = (
      await createRadiologyExam(orgId, { name: "X-Ray Chest PA View", requiresSafetyCheck: false })
    ).id;
  });

  afterAll(async () => {
    await cleanupOrg(orgId);
  });

  async function newCartToken(): Promise<string> {
    const res = await request(app).post("/api/cart").send({ orgSlug });
    return res.body.token as string;
  }

  it("is not required for a cart with no safety-flagged exam", async () => {
    const token = await newCartToken();
    await request(app)
      .post(`/api/cart/${token}/items`)
      .send({ itemType: "RADIOLOGY_EXAM", itemId: xrayExam });
    const res = await request(app).get(`/api/cart/${token}/safety-check-required`);
    expect(res.body.safetyCheckRequired).toBe(false);
  });

  it("is required once an MRI exam is in the cart", async () => {
    const token = await newCartToken();
    await request(app)
      .post(`/api/cart/${token}/items`)
      .send({ itemType: "RADIOLOGY_EXAM", itemId: mriExam });
    const res = await request(app).get(`/api/cart/${token}/safety-check-required`);
    expect(res.body.safetyCheckRequired).toBe(true);
  });

  it("an all-clear questionnaire does not block the cart", async () => {
    const token = await newCartToken();
    await request(app)
      .post(`/api/cart/${token}/items`)
      .send({ itemType: "RADIOLOGY_EXAM", itemId: mriExam });

    const submit = await request(app)
      .post(`/api/cart/${token}/safety-check`)
      .send({ answers: { PREGNANCY: false, PACEMAKER: false, IMPLANTS: false, ALLERGIES: false } });
    expect(submit.body.flagged).toBe(false);

    const cart = await request(app).get(`/api/cart/${token}`);
    expect(cart.body.blockedBySafety).toBe(false);
  });

  it("a flagged answer blocks the cart server-side via blockedBySafety", async () => {
    const token = await newCartToken();
    await request(app)
      .post(`/api/cart/${token}/items`)
      .send({ itemType: "RADIOLOGY_EXAM", itemId: mriExam });

    const submit = await request(app)
      .post(`/api/cart/${token}/safety-check`)
      .send({ answers: { PREGNANCY: false, PACEMAKER: true, IMPLANTS: false, ALLERGIES: false } });
    expect(submit.body.flagged).toBe(true);

    const cart = await request(app).get(`/api/cart/${token}`);
    expect(cart.body.blockedBySafety).toBe(true);
  });

  it("rejects an incomplete answer set", async () => {
    const token = await newCartToken();
    const res = await request(app)
      .post(`/api/cart/${token}/safety-check`)
      .send({ answers: { PREGNANCY: false, PACEMAKER: false } });
    expect(res.status).toBe(400);
  });
});

describe("home collection", () => {
  let orgSlug: string;
  let orgId: string;
  let eligibleTest: string;
  let ineligibleTest: string;
  let examMri: string;

  beforeAll(async () => {
    const org = await createTestOrg("home-collection");
    orgSlug = org.slug;
    orgId = org.id;
    eligibleTest = (
      await createLabTest(orgId, { name: "Lipid Profile", homeCollectionEligible: true })
    ).id;
    ineligibleTest = (
      await createLabTest(orgId, { name: "Semen Analysis", homeCollectionEligible: false })
    ).id;
    examMri = (await createRadiologyExam(orgId, { name: "MRI Brain Plain" })).id;
    await createServiceableArea(orgId, { pinCode: "500016", homeCollectionCharge: 150 });

    // A home-collection booking still needs a real centre to dispatch against (the schema
    // requires Booking.centreId regardless of collection mode) — without a centre actually
    // offering the eligible test, "serviceable" would resolve to a centre that can't fulfil it.
    const centre = await createCentre(orgId, { offersLab: true });
    await linkCentreLabTest(centre.id, eligibleTest);
  });

  afterAll(async () => {
    await cleanupOrg(orgId);
  });

  async function newCartToken(): Promise<string> {
    const res = await request(app).post("/api/cart").send({ orgSlug });
    return res.body.token as string;
  }

  it("check-pin: serviceable for a covered PIN with an eligible lab-only cart", async () => {
    const token = await newCartToken();
    await request(app)
      .post(`/api/cart/${token}/items`)
      .send({ itemType: "LAB_TEST", itemId: eligibleTest });

    const res = await request(app)
      .post(`/api/cart/${token}/home-collection/check-pin`)
      .send({ pinCode: "500016" });
    expect(res.body).toEqual({ serviceable: true, homeCollectionCharge: 150 });
  });

  it("check-pin: not serviceable for a PIN with no ServiceableArea row", async () => {
    const token = await newCartToken();
    await request(app)
      .post(`/api/cart/${token}/items`)
      .send({ itemType: "LAB_TEST", itemId: eligibleTest });

    const res = await request(app)
      .post(`/api/cart/${token}/home-collection/check-pin`)
      .send({ pinCode: "999999" });
    expect(res.body).toEqual({ serviceable: false, homeCollectionCharge: null });
  });

  it("check-pin: not serviceable when any cart item is home-collection-ineligible", async () => {
    const token = await newCartToken();
    await request(app)
      .post(`/api/cart/${token}/items`)
      .send({ itemType: "LAB_TEST", itemId: eligibleTest });
    await request(app)
      .post(`/api/cart/${token}/items`)
      .send({ itemType: "LAB_TEST", itemId: ineligibleTest });

    const res = await request(app)
      .post(`/api/cart/${token}/home-collection/check-pin`)
      .send({ pinCode: "500016" });
    expect(res.body.serviceable).toBe(false);
  });

  it("check-pin: not serviceable for a Combined cart (centre-visit only per spec)", async () => {
    const token = await newCartToken();
    await request(app)
      .post(`/api/cart/${token}/items`)
      .send({ itemType: "LAB_TEST", itemId: eligibleTest });
    await request(app)
      .post(`/api/cart/${token}/items`)
      .send({ itemType: "RADIOLOGY_EXAM", itemId: examMri });

    const res = await request(app)
      .post(`/api/cart/${token}/home-collection/check-pin`)
      .send({ pinCode: "500016" });
    expect(res.body.serviceable).toBe(false);
  });

  it("address: saves the address and auto-adds a Home Collection Charge line item, replacing on re-save", async () => {
    const token = await newCartToken();
    await request(app)
      .post(`/api/cart/${token}/items`)
      .send({ itemType: "LAB_TEST", itemId: eligibleTest });

    const firstSave = await request(app)
      .post(`/api/cart/${token}/home-collection/address`)
      .send({ pinCode: "500016", houseNumber: "12", street: "Main Road" });
    expect(firstSave.status).toBe(201);
    expect(firstSave.body.collectionMode).toBe("HOME_COLLECTION");
    const chargeItems = firstSave.body.items.filter(
      (i: { itemType: string }) => i.itemType === "HOME_COLLECTION_CHARGE",
    );
    expect(chargeItems).toHaveLength(1);
    expect(chargeItems[0].price).toBe(150);

    // Re-saving (e.g. the patient edits their address) must not stack a second charge line.
    const secondSave = await request(app)
      .post(`/api/cart/${token}/home-collection/address`)
      .send({ pinCode: "500016", houseNumber: "14", street: "Main Road" });
    const chargeItemsAfter = secondSave.body.items.filter(
      (i: { itemType: string }) => i.itemType === "HOME_COLLECTION_CHARGE",
    );
    expect(chargeItemsAfter).toHaveLength(1);
  });

  it("address: rejects a non-serviceable PIN", async () => {
    const token = await newCartToken();
    await request(app)
      .post(`/api/cart/${token}/items`)
      .send({ itemType: "LAB_TEST", itemId: eligibleTest });

    const res = await request(app)
      .post(`/api/cart/${token}/home-collection/address`)
      .send({ pinCode: "999999", houseNumber: "12", street: "Main Road" });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/cart/:token/preparation-instructions", () => {
  let orgSlug: string;
  let orgId: string;
  let examMri: string;
  let testLipid: string;

  beforeAll(async () => {
    const org = await createTestOrg("prep");
    orgSlug = org.slug;
    orgId = org.id;
    examMri = (await createRadiologyExam(orgId, { name: "MRI Brain Plain" })).id;
    testLipid = (await createLabTest(orgId, { name: "Lipid Profile" })).id;
  });

  afterAll(async () => {
    await cleanupOrg(orgId);
  });

  it("groups instructions by radiology vs lab for a combined cart", async () => {
    const createRes = await request(app).post("/api/cart").send({ orgSlug });
    const token = createRes.body.token as string;
    await request(app)
      .post(`/api/cart/${token}/items`)
      .send({ itemType: "RADIOLOGY_EXAM", itemId: examMri });
    await request(app)
      .post(`/api/cart/${token}/items`)
      .send({ itemType: "LAB_TEST", itemId: testLipid });

    const res = await request(app).get(`/api/cart/${token}/preparation-instructions`);
    expect(res.body.radiology).toHaveLength(1);
    expect(res.body.radiology[0].id).toBe(examMri);
    expect(res.body.lab).toHaveLength(1);
    expect(res.body.lab[0].id).toBe(testLipid);
  });
});

describe("POST /api/orgs/:orgSlug/centres/nearby", () => {
  let orgSlug: string;
  let orgId: string;
  let nearCentreId: string;
  let farCentreId: string;

  beforeAll(async () => {
    const org = await createTestOrg("nearby");
    orgSlug = org.slug;
    orgId = org.id;
    // Ameerpet, Hyderabad
    nearCentreId = (
      await createCentre(orgId, {
        name: "Near Centre",
        city: "Hyderabad",
        area: "Ameerpet",
        lat: 17.4374,
        lng: 78.4487,
      })
    ).id;
    // Roughly Mumbai — hundreds of km away
    farCentreId = (
      await createCentre(orgId, {
        name: "Far Centre",
        city: "Hyderabad",
        area: "Somewhere Else",
        lat: 19.076,
        lng: 72.8777,
      })
    ).id;
  });

  afterAll(async () => {
    await cleanupOrg(orgId);
  });

  it("sorts centres by straight-line distance when lat/lng is given", async () => {
    const res = await request(app)
      .post(`/api/orgs/${orgSlug}/centres/nearby`)
      .send({ lat: 17.4374, lng: 78.4487 });
    expect(res.body.centres[0].id).toBe(nearCentreId);
    expect(res.body.centres[0].distanceKm).toBeLessThan(1);
    expect(res.body.centres[1].id).toBe(farCentreId);
    expect(res.body.centres[1].distanceKm).toBeGreaterThan(500);
  });

  it("filters by city and prioritizes an exact area match when city+area is given", async () => {
    const res = await request(app)
      .post(`/api/orgs/${orgSlug}/centres/nearby`)
      .send({ city: "Hyderabad", area: "Ameerpet" });
    expect(res.body.centres[0].id).toBe(nearCentreId);
    expect(res.body.centres[0].distanceKm).toBeNull();
  });

  it("rejects a request with neither coordinates nor city/area", async () => {
    const res = await request(app).post(`/api/orgs/${orgSlug}/centres/nearby`).send({});
    expect(res.status).toBe(400);
  });
});
