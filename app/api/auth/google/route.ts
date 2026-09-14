import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/config/env";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const returnTo = searchParams.get("returnTo") || "/dashboard";

  if (!env.google.clientId || !env.google.clientSecret) {
    // Google OAuth is not configured in .env yet
    const fallbackUrl = new URL("/login", env.app.url);
    fallbackUrl.searchParams.set("error", "google_not_configured");
    return NextResponse.redirect(fallbackUrl);
  }

  const origin = req.nextUrl.origin;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    `${origin}/api/auth/google/callback`;

  const state = Buffer.from(
    JSON.stringify({
      returnTo,
      redirectUri,
      nonce: crypto.randomBytes(16).toString("hex"),
    })
  ).toString("base64url");

  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", env.google.clientId);
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "openid email profile");
  googleAuthUrl.searchParams.set("access_type", "offline");
  googleAuthUrl.searchParams.set("prompt", "select_account");
  googleAuthUrl.searchParams.set("state", state);

  return NextResponse.redirect(googleAuthUrl);
}
