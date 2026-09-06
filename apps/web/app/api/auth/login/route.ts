import { NextRequest, NextResponse } from "next/server";

/**
 * Initiates Google OAuth flow for Stitch design integration
 */
export async function GET(request: NextRequest) {
  const state = Math.random().toString(36).substring(7);
  const scope = [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/spreadsheets",
  ].join(" ");

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID || "",
    redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URI || "",
    response_type: "code",
    scope,
    state,
    access_type: "offline",
    prompt: "consent",
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

  return NextResponse.redirect(authUrl);
}
