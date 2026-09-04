// Integration tests hit a real Postgres via @rlap/db's DATABASE_URL (same one `pnpm dev`
// uses) — each test file creates its own uniquely-slugged organization and tears it down
// afterwards, so this is safe to run against a database that already has seeded data.
import { randomUUID } from "crypto";
import request from "supertest";
import { prisma } from "@rlap/db";
import { createApp } from "../app";
import { hashPassword } from "../admin/passwordService";

export const app = createApp();

export async function createTestOrg(prefix: string) {
  const suffix = randomUUID().slice(0, 8);
  return prisma.organization.create({
    data: { name: `Test Org ${prefix} ${suffix}`, slug: `test-${prefix}-${suffix}` },
  });
}

export async function createRadiologyExam(
  organizationId: string,
  overrides: Partial<{ name: string; price: number; requiresSafetyCheck: boolean }> = {},
) {
  return prisma.radiologyExam.create({
    data: {
      organizationId,
      name: overrides.name ?? "Test MRI Brain Plain",
      modality: "MRI",
      bodyPartCategory: "HEAD_NECK",
      requiresSafetyCheck: overrides.requiresSafetyCheck ?? true,
      price: overrides.price ?? 6500,
    },
  });
}

export async function createLabTest(
  organizationId: string,
  overrides: Partial<{ name: string; price: number; homeCollectionEligible: boolean }> = {},
) {
  return prisma.labTest.create({
    data: {
      organizationId,
      name: overrides.name ?? "Test Lipid Profile",
      category: "Biochemistry",
      price: overrides.price ?? 700,
      homeCollectionEligible: overrides.homeCollectionEligible ?? true,
    },
  });
}

export async function createCentre(
  organizationId: string,
  overrides: Partial<{
    name: string;
    city: string;
    area: string;
    lat: number;
    lng: number;
    offersRadiology: boolean;
    offersLab: boolean;
  }> = {},
) {
  const suffix = randomUUID().slice(0, 6);
  return prisma.centre.create({
    data: {
      organizationId,
      name: overrides.name ?? `Test Centre ${suffix}`,
      address: "1 Test Street",
      city: overrides.city ?? "Hyderabad",
      area: overrides.area ?? "Ameerpet",
      lat: overrides.lat ?? 17.4374,
      lng: overrides.lng ?? 78.4487,
      offersRadiology: overrides.offersRadiology ?? true,
      offersLab: overrides.offersLab ?? true,
    },
  });
}

export async function linkCentreRadiologyExam(centreId: string, radiologyExamId: string) {
  return prisma.centreRadiologyExam.create({ data: { centreId, radiologyExamId } });
}

export async function linkCentreLabTest(centreId: string, labTestId: string) {
  return prisma.centreLabTest.create({ data: { centreId, labTestId } });
}

export async function createSlot(
  centreId: string,
  overrides: Partial<{
    type: "RADIOLOGY" | "LAB" | "HOME_COLLECTION_WINDOW";
    date: Date;
    startTime: Date;
    endTime: Date;
    capacity: number;
    bookedCount: number;
  }> = {},
) {
  return prisma.slot.create({
    data: {
      centreId,
      type: overrides.type ?? "RADIOLOGY",
      date: overrides.date ?? new Date(Date.UTC(2030, 0, 1)),
      startTime: overrides.startTime ?? new Date(Date.UTC(1970, 0, 1, 9, 0)),
      endTime: overrides.endTime ?? new Date(Date.UTC(1970, 0, 1, 9, 30)),
      capacity: overrides.capacity ?? 1,
      bookedCount: overrides.bookedCount ?? 0,
    },
  });
}

export async function createServiceableArea(
  organizationId: string,
  overrides: Partial<{
    pinCode: string;
    homeCollectionCharge: number;
    centreId: string;
    isActive: boolean;
  }> = {},
) {
  return prisma.serviceableArea.create({
    data: {
      organizationId,
      pinCode: overrides.pinCode ?? "500016",
      homeCollectionCharge: overrides.homeCollectionCharge ?? 150,
      centreId: overrides.centreId,
      isActive: overrides.isActive ?? true,
    },
  });
}

export async function createBooking(
  organizationId: string,
  centreId: string,
  overrides: Partial<{
    status: "PENDING_PAYMENT" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
    mobileNumber: string;
    totalAmount: number;
  }> = {},
) {
  const suffix = randomUUID().slice(0, 8);
  const patient = await prisma.patient.create({
    data: {
      organizationId,
      mobileNumber: overrides.mobileNumber ?? `90000${suffix.slice(0, 5)}`,
      name: "Test Patient",
    },
  });
  return prisma.booking.create({
    data: {
      bookingCode: `RLAP-T${suffix.toUpperCase()}`,
      organizationId,
      patientId: patient.id,
      centreId,
      type: "RADIOLOGY",
      status: overrides.status ?? "CONFIRMED",
      paymentMethod: "PAY_AT_RECEPTION",
      totalAmount: overrides.totalAmount ?? 500,
    },
  });
}

const TEST_ADMIN_PASSWORD = "test-admin-password-123";

export async function createAdminUser(
  organizationId: string,
  overrides: Partial<{ email: string; name: string; password: string }> = {},
) {
  const suffix = randomUUID().slice(0, 8);
  const password = overrides.password ?? TEST_ADMIN_PASSWORD;
  const admin = await prisma.adminUser.create({
    data: {
      organizationId,
      email: overrides.email ?? `admin-${suffix}@test.local`,
      name: overrides.name ?? "Test Admin",
      passwordHash: await hashPassword(password),
    },
  });
  return { admin, password };
}

/** Logs in via the real HTTP endpoint (rather than hand-signing a cookie) and returns the
 * Set-Cookie header value so callers can pass it straight to `.set("Cookie", ...)`. */
export async function loginAsAdmin(email: string, password: string): Promise<string> {
  const res = await request(app).post("/api/admin/auth/login").send({ email, password });
  if (res.status !== 200) {
    throw new Error(`Test admin login failed (${res.status}): ${JSON.stringify(res.body)}`);
  }
  const setCookie = res.headers["set-cookie"];
  if (!setCookie || setCookie.length === 0) {
    throw new Error("Admin login did not set a session cookie");
  }
  return setCookie[0]!.split(";")[0]!;
}

export async function cleanupOrg(organizationId: string) {
  const adminUsers = await prisma.adminUser.findMany({
    where: { organizationId },
    select: { id: true },
  });
  if (adminUsers.length > 0) {
    await prisma.adminSession.deleteMany({
      where: { adminUserId: { in: adminUsers.map((a) => a.id) } },
    });
    await prisma.adminUser.deleteMany({ where: { organizationId } });
  }

  // Booking cascades to lineItems/bookingSlots/safetyCheckResponses/sentNotifications, but
  // Booking itself has Restrict FKs to centre/patient/exam/test — must go first.
  await prisma.booking.deleteMany({ where: { organizationId } });

  const centres = await prisma.centre.findMany({ where: { organizationId }, select: { id: true } });
  const centreIds = centres.map((centre) => centre.id);
  if (centreIds.length > 0) {
    await prisma.centreRadiologyExam.deleteMany({ where: { centreId: { in: centreIds } } });
    await prisma.centreLabTest.deleteMany({ where: { centreId: { in: centreIds } } });
    await prisma.serviceableArea.deleteMany({ where: { centreId: { in: centreIds } } });
    // Deleting Slot cascades to any SlotHold rows referencing it (schema onDelete: Cascade).
    await prisma.slot.deleteMany({ where: { centreId: { in: centreIds } } });
  }
  await prisma.serviceableArea.deleteMany({ where: { organizationId } });
  await prisma.centre.deleteMany({ where: { organizationId } });
  await prisma.otpVerification.deleteMany({ where: { organizationId } });
  await prisma.patient.deleteMany({ where: { organizationId } });
  await prisma.labTest.deleteMany({ where: { organizationId } });
  await prisma.radiologyExam.deleteMany({ where: { organizationId } });
  await prisma.organization.delete({ where: { id: organizationId } });
}
