import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db/connection";
import { User, Organization } from "@/lib/db/models";
import { signJwt } from "@/lib/auth/jwt";
import { apiError, apiSuccess } from "@/lib/auth/api-auth";
import { seedDatabase } from "@/lib/db/seed";
import { env } from "@/lib/config/env";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    await seedDatabase(false);

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return apiError("Email and password are required", "VALIDATION_ERROR", 400);
    }

    const user = await User.findOne({ email: email.toLowerCase().trim(), isDeleted: false });
    if (!user) {
      return apiError("Invalid email or password", "INVALID_CREDENTIALS", 401);
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return apiError("Invalid email or password", "INVALID_CREDENTIALS", 401);
    }

    const organization = await Organization.findOne({ _id: user.organizationId, isDeleted: false });
    if (!organization) {
      return apiError("Organization not found", "ORG_NOT_FOUND", 404);
    }

    // Sign JWT
    const token = signJwt({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: organization._id.toString(),
    });

    const response = apiSuccess({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        timezone: user.timezone,
        organizationId: user.organizationId.toString(),
      },
      organization: {
        id: organization._id.toString(),
        name: organization.name,
        slug: organization.slug,
        currency: organization.currency,
        billingPlan: organization.billingPlan,
      },
    });

    // Set HTTP-only cookie
    response.cookies.set(env.auth.cookieName, token, {
      httpOnly: true,
      secure: env.app.isProduction,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("Login API error:", err);
    return apiError(err.message || "Internal server error", "INTERNAL_ERROR", 500);
  }
}
