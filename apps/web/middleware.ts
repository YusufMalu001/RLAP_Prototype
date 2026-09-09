import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ROLE_COOKIE } from "./lib/session";

const PUBLIC_PATHS = new Set(["/", "/login"]);
const ADMIN_HOME = "/admin/dashboard";
const PATIENT_HOME = "/vijaya-diagnostics/book";

/** Route-level RBAC: keeps /admin/** and the patient booking widget strictly separated.
 * Screen-level protection (AdminShell's own api.me() check) still applies underneath this as
 * a second layer — this just stops the wrong role from ever navigating there in the first
 * place, and bounces a signed-in user to their own home instead of dead-ending at /login. */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.has(pathname) || pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const role = req.cookies.get(ROLE_COOKIE)?.value;
  const isAdminPath = pathname.startsWith("/admin");

  if (isAdminPath) {
    if (role === "ADMIN") return NextResponse.next();
    if (role === "PATIENT") return NextResponse.redirect(new URL(PATIENT_HOME, req.url));
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Everything else is the patient-facing booking widget / reports / profile.
  if (role === "PATIENT") return NextResponse.next();
  if (role === "ADMIN") return NextResponse.redirect(new URL(ADMIN_HOME, req.url));
  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|icon.svg).*)"],
};
