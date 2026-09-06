import { NextRequest, NextResponse } from "next/server";

/**
 * Google OAuth callback handler for Stitch integration
 * Receives the authorization code and exchanges it for access token
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Handle auth errors
    if (error) {
      console.error("OAuth error:", error);
      return NextResponse.redirect(
        new URL(`/?error=${error}`, request.nextUrl.origin)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/?error=no_code", request.nextUrl.origin)
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_OAUTH_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || "",
        code,
        grant_type: "authorization_code",
        redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URI || "",
      }),
    });

    if (!tokenResponse.ok) {
      console.error("Token exchange failed:", tokenResponse.statusText);
      return NextResponse.redirect(
        new URL("/?error=token_exchange_failed", request.nextUrl.origin)
      );
    }

    const tokens = await tokenResponse.json();
    const accessToken = tokens.access_token;

    // Store token in secure httpOnly cookie
    const response = NextResponse.redirect(new URL("/", request.nextUrl.origin));
    response.cookies.set({
      name: "google_access_token",
      value: accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: tokens.expires_in || 3600,
    });

    return response;
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/?error=callback_error", request.nextUrl.origin)
    );
  }
}
