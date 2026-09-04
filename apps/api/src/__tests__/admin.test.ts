import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { prisma } from "@rlap/db";
import {
  app,
  cleanupOrg,
  createAdminUser,
  createBooking,
  createCentre,
  createTestOrg,
  loginAsAdmin,
} from "./helpers";

describe("admin auth", () => {
  let orgId: string;
  let email: string;
  let password: string;

  beforeAll(async () => {
    const org = await createTestOrg("admin-auth");
    orgId = org.id;
    const created = await createAdminUser(orgId);
    email = created.admin.email;
    password = created.password;
  });

  afterAll(async () => cleanupOrg(orgId));

  it("rejects login with the wrong password", async () => {
    const res = await request(app)
      .post("/api/admin/auth/login")
      .send({ email, password: "wrong-password" });
    expect(res.status).toBe(401);
  });

  it("logs in with correct credentials and sets a session cookie", async () => {
    const res = await request(app).post("/api/admin/auth/login").send({ email, password });
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(email);
    expect(res.headers["set-cookie"]?.[0]).toMatch(/rlap_admin_session/);
  });

  it("rejects any /api/admin/* request without a session cookie", async () => {
    const res = await request(app).get("/api/admin/dashboard");
    expect(res.status).toBe(401);
  });

  it("accepts requests carrying a valid session cookie", async () => {
    const cookie = await loginAsAdmin(email, password);
    const res = await request(app).get("/api/admin/dashboard").set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("todayBookingsCount");
    expect(res.body).toHaveProperty("upcomingBookings");
    expect(res.body).toHaveProperty("centres");
  });

  it("rejects a session cookie after logout", async () => {
    const cookie = await loginAsAdmin(email, password);
    await request(app).post("/api/admin/auth/logout").set("Cookie", cookie).expect(200);
    const res = await request(app).get("/api/admin/dashboard").set("Cookie", cookie);
    expect(res.status).toBe(401);
  });
});

describe("admin org isolation", () => {
  let orgAId: string;
  let orgBId: string;
  let cookieA: string;

  beforeAll(async () => {
    const orgA = await createTestOrg("admin-iso-a");
    const orgB = await createTestOrg("admin-iso-b");
    orgAId = orgA.id;
    orgBId = orgB.id;

    const { admin, password } = await createAdminUser(orgAId);
    cookieA = await loginAsAdmin(admin.email, password);

    await createCentre(orgAId, { name: "Org A Centre" });
    await createCentre(orgBId, { name: "Org B Centre" });
  });

  afterAll(async () => {
    await cleanupOrg(orgAId);
    await cleanupOrg(orgBId);
  });

  it("only returns centres belonging to the admin's own organization", async () => {
    const res = await request(app).get("/api/admin/centres").set("Cookie", cookieA);
    expect(res.status).toBe(200);
    const names = res.body.centres.map((c: { name: string }) => c.name);
    expect(names).toContain("Org A Centre");
    expect(names).not.toContain("Org B Centre");
  });

  it("404s when fetching a booking that belongs to a different organization", async () => {
    const centreB = await createCentre(orgBId, { name: "Org B Centre 2" });
    const bookingB = await createBooking(orgBId, centreB.id);
    const res = await request(app).get(`/api/admin/bookings/${bookingB.id}`).set("Cookie", cookieA);
    expect(res.status).toBe(404);
  });
});

describe("admin slot generation", () => {
  let orgId: string;
  let centreId: string;
  let cookie: string;

  beforeAll(async () => {
    const org = await createTestOrg("admin-slots");
    orgId = org.id;
    const centre = await createCentre(orgId, { offersRadiology: true });
    centreId = centre.id;
    const { admin, password } = await createAdminUser(orgId);
    cookie = await loginAsAdmin(admin.email, password);
  });

  afterAll(async () => cleanupOrg(orgId));

  it("bulk-generates a slot grid for N days at X per hour", async () => {
    const res = await request(app)
      .post(`/api/admin/centres/${centreId}/slots/generate`)
      .set("Cookie", cookie)
      .send({
        type: "RADIOLOGY",
        days: 3,
        startHour: 9,
        endHour: 11,
        slotsPerHour: 2,
        capacityPerSlot: 4,
      });

    expect(res.status).toBe(201);
    // 2 hours * 2 slots/hour * 3 days = 12 slots.
    expect(res.body.requested).toBe(12);
    expect(res.body.created).toBe(12);

    const slots = await prisma.slot.findMany({ where: { centreId, type: "RADIOLOGY" } });
    expect(slots).toHaveLength(12);
    expect(slots.every((s) => s.capacity === 4)).toBe(true);
  });

  it("is safe to re-run — skips slots that already exist instead of erroring or duplicating", async () => {
    const res = await request(app)
      .post(`/api/admin/centres/${centreId}/slots/generate`)
      .set("Cookie", cookie)
      .send({
        type: "RADIOLOGY",
        days: 3,
        startHour: 9,
        endHour: 11,
        slotsPerHour: 2,
        capacityPerSlot: 4,
      });

    expect(res.status).toBe(201);
    expect(res.body.requested).toBe(12);
    expect(res.body.created).toBe(0);

    const slots = await prisma.slot.findMany({ where: { centreId, type: "RADIOLOGY" } });
    expect(slots).toHaveLength(12);
  });
});

describe("admin booking completion", () => {
  let orgId: string;
  let centreId: string;
  let cookie: string;

  beforeAll(async () => {
    const org = await createTestOrg("admin-complete");
    orgId = org.id;
    const centre = await createCentre(orgId);
    centreId = centre.id;
    const { admin, password } = await createAdminUser(orgId);
    cookie = await loginAsAdmin(admin.email, password);
  });

  afterAll(async () => cleanupOrg(orgId));

  it("marks a CONFIRMED booking as COMPLETED", async () => {
    const booking = await createBooking(orgId, centreId, { status: "CONFIRMED" });
    const res = await request(app)
      .post(`/api/admin/bookings/${booking.id}/complete`)
      .set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("COMPLETED");
  });

  it("refuses to complete a booking that isn't CONFIRMED", async () => {
    const booking = await createBooking(orgId, centreId, { status: "PENDING_PAYMENT" });
    const res = await request(app)
      .post(`/api/admin/bookings/${booking.id}/complete`)
      .set("Cookie", cookie);
    expect(res.status).toBe(409);
  });
});
