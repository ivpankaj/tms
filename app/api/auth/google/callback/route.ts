import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/db/connection";
import { User, Organization } from "@/lib/db/models";
import { signJwt } from "@/lib/auth/jwt";
import { env } from "@/lib/config/env";
import { initializeWorkspaceDefaults } from "@/lib/db/workspace-init";

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email?: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const stateRaw = searchParams.get("state");

  let returnTo = "/";
  if (stateRaw) {
    try {
      const parsedState = JSON.parse(Buffer.from(stateRaw, "base64url").toString("utf-8"));
      if (parsedState.returnTo && typeof parsedState.returnTo === "string") {
        returnTo = parsedState.returnTo;
      }
    } catch {
      // ignore state parse errors
    }
  }

  if (error) {
    console.error("[Google OAuth Callback Error]:", error);
    const errUrl = new URL("/login", env.app.url);
    errUrl.searchParams.set("error", error);
    return NextResponse.redirect(errUrl);
  }

  if (!code) {
    const errUrl = new URL("/login", env.app.url);
    errUrl.searchParams.set("error", "missing_code");
    return NextResponse.redirect(errUrl);
  }

  try {
    // 1. Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.google.clientId,
        client_secret: env.google.clientSecret,
        redirect_uri: env.google.redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("[Google Token Exchange Failed]:", tokenData);
      const errUrl = new URL("/login", env.app.url);
      errUrl.searchParams.set("error", tokenData.error_description || "token_exchange_failed");
      return NextResponse.redirect(errUrl);
    }

    // 2. Fetch Google User profile
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser: GoogleUserInfo = await userInfoRes.json();
    if (!userInfoRes.ok || !googleUser.email) {
      console.error("[Google UserInfo Failed]:", googleUser);
      const errUrl = new URL("/login", env.app.url);
      errUrl.searchParams.set("error", "user_info_failed");
      return NextResponse.redirect(errUrl);
    }

    await connectToDatabase();
    const cleanEmail = googleUser.email.toLowerCase().trim();

    let user = await User.findOne({ email: cleanEmail, isDeleted: false });
    let organization;

    if (user) {
      // Existing user signing in with Google
      if (!user.googleId || !user.avatar) {
        user.googleId = googleUser.id;
        if (!user.avatar && googleUser.picture) {
          user.avatar = googleUser.picture;
        }
        if (!user.authProvider) {
          user.authProvider = "google";
        }
        await user.save();
      }

      organization = await Organization.findOne({ _id: user.organizationId, isDeleted: false });
    } else {
      // New user signing up with Google - create organization and workspace
      const userName = googleUser.name || "Google User";
      const orgName = `${userName}'s Workspace`;
      const cleanSlug =
        userName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "") || "workspace";
      const slug = `${cleanSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

      organization = await Organization.create({
        name: orgName,
        slug,
        billingPlan: "starter",
        timezone: "Asia/Kolkata",
        currency: "INR",
      });

      const randomPassword = crypto.randomBytes(32).toString("hex");
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      user = await User.create({
        name: userName,
        email: cleanEmail,
        passwordHash,
        role: "Super Admin",
        organizationId: organization._id,
        avatar: googleUser.picture,
        googleId: googleUser.id,
        authProvider: "google",
        status: "active",
        timezone: "Asia/Kolkata",
      });

      // Initialize default pipeline & tags for the new workspace
      await initializeWorkspaceDefaults(organization._id, user._id);
    }

    if (!organization) {
      const errUrl = new URL("/login", env.app.url);
      errUrl.searchParams.set("error", "workspace_not_found");
      return NextResponse.redirect(errUrl);
    }

    // 3. Issue Session JWT
    const token = signJwt({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: organization._id.toString(),
    });

    const redirectResponse = NextResponse.redirect(new URL(returnTo, env.app.url));
    redirectResponse.cookies.set(env.auth.cookieName, token, {
      httpOnly: true,
      secure: env.app.isProduction,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return redirectResponse;
  } catch (err: any) {
    console.error("[Google OAuth Callback Fatal]:", err);
    const errUrl = new URL("/login", env.app.url);
    errUrl.searchParams.set("error", "oauth_internal_error");
    return NextResponse.redirect(errUrl);
  }
}
