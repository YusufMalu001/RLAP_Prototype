import { randomBytes } from "crypto";
import { prisma } from "@rlap/db";
import type { AdminUser } from "@rlap/db";
import { HttpError } from "../lib/httpError";
import { hashPassword, verifyPassword } from "./passwordService";

export class AdminAuthError extends HttpError {}

export const ADMIN_SESSION_COOKIE = "rlap_admin_session";
const ADMIN_SESSION_TTL_SECONDS = 8 * 60 * 60; // 8h — an admin's working day.

function generateToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function login(
  email: string,
  password: string,
): Promise<{ token: string; expiresAt: Date; admin: AdminUser }> {
  const admin = await prisma.adminUser.findUnique({ where: { email: email.toLowerCase() } });
  if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
    throw new AdminAuthError(401, "Invalid email or password");
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_TTL_SECONDS * 1000);
  await prisma.adminSession.create({ data: { token, adminUserId: admin.id, expiresAt } });
  return { token, expiresAt, admin };
}

export async function logout(token: string): Promise<void> {
  await prisma.adminSession.deleteMany({ where: { token } });
}

export async function getSessionAdmin(token: string): Promise<AdminUser> {
  const session = await prisma.adminSession.findUnique({
    where: { token },
    include: { adminUser: true },
  });
  if (!session) {
    throw new AdminAuthError(401, "Not authenticated");
  }
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.adminSession.delete({ where: { token } }).catch(() => {});
    throw new AdminAuthError(401, "Session expired — please log in again");
  }
  return session.adminUser;
}

export async function createAdminUser(
  organizationId: string,
  email: string,
  password: string,
  name: string,
): Promise<AdminUser> {
  return prisma.adminUser.create({
    data: {
      organizationId,
      email: email.toLowerCase(),
      passwordHash: await hashPassword(password),
      name,
    },
  });
}
