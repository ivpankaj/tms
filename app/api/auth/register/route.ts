import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db/connection";
import { User, Organization } from "@/lib/db/models";
import { signJwt } from "@/lib/auth/jwt";
import { apiError, apiSuccess } from "@/lib/auth/api-auth";
import { env } from "@/lib/config/env";
import { initializeWorkspaceDefaults } from "@/lib/db/workspace-init";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { name, email, password, organizationName, verificationToken } = body;

    if (!email || !password) {
      return apiError("Email and password are required", "VALIDATION_ERROR", 400);
    }

    if (password.length < 6) {
      return apiError("Password must be at least 6 characters long", "VALIDATION_ERROR", 400);
    }

    const cleanEmail = email.toLowerCase().trim();

    // Verify cryptographic token if provided
    if (verificationToken) {
      const { verifyVerificationToken } = await import("@/lib/auth/jwt");
      const verifiedPayload = verifyVerificationToken(verificationToken);
      if (!verifiedPayload || verifiedPayload.email !== cleanEmail) {
        return apiError("Email verification session has expired. Please verify again.", "INVALID_TOKEN", 403);
      }
    }

    const existing = await User.findOne({ email: cleanEmail, isDeleted: false });
    if (existing) {
      return apiError("A user with this email already exists", "USER_EXISTS", 409);
    }

    const resolvedName = (name && name.trim()) || cleanEmail.split("@")[0];
    const resolvedOrgName = (organizationName && organizationName.trim()) || `${resolvedName}'s Workspace`;

    // Create organization
    const slug = resolvedOrgName.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Math.floor(Math.random() * 1000);
    const org = await Organization.create({
      name: resolvedOrgName,
      slug,
      billingPlan: "starter",
    });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: resolvedName,
      email: cleanEmail,
      passwordHash,
      role: "Super Admin",
      organizationId: org._id,
      status: "active",
    });

    // Cleanup OTP records
    const { OtpVerification } = await import("@/lib/db/models");
    await OtpVerification.deleteMany({ email: cleanEmail }).catch(() => {});

    // Initialize workspace default pipeline and tags
    await initializeWorkspaceDefaults(org._id, user._id);

    const token = signJwt({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: org._id.toString(),
    });

    const response = apiSuccess({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
      organization: {
        id: org._id.toString(),
        name: org.name,
        slug: org.slug,
      },
    }, undefined, 201);

    response.cookies.set(env.auth.cookieName, token, {
      httpOnly: true,
      secure: env.app.isProduction,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("Register error:", err);
    return apiError(err.message || "Failed to register", "INTERNAL_ERROR", 500);
  }
}
