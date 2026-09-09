export type Role = "ADMIN" | "PATIENT";

export const ROLE_COOKIE = "rlap_role";

// Hardcoded per the prototype's RBAC spec — deliberately not backed by a database. The ADMIN
// pair must match packages/db/seed.ts's DEV_ADMIN_EMAIL/DEV_ADMIN_PASSWORD, since a successful
// admin login here also establishes a real session against the API's own admin auth (see
// app/login/page.tsx) — that's what lets the /admin dashboard's data calls succeed.
const ACCOUNTS: Record<string, { password: string; role: Role }> = {
  "admin@gmail.com": { password: "admin@123", role: "ADMIN" },
  "patient@gmail.com": { password: "patient@123", role: "PATIENT" },
};

export function resolveRole(email: string, password: string): Role | null {
  const account = ACCOUNTS[email.trim().toLowerCase()];
  if (!account || account.password !== password) return null;
  return account.role;
}

export function homeForRole(role: Role): string {
  return role === "ADMIN" ? "/admin/dashboard" : "/vijaya-diagnostics/book";
}
