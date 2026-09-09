import { NextResponse } from "next/server";
import { ROLE_COOKIE } from "@/lib/session";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ROLE_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
