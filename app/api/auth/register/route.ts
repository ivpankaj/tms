import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db/connection";
import { User, Organization } from "@/lib/db/models";
import { signJwt } from "@/lib/auth/jwt";
import { apiError, apiSuccess } from "@/lib/auth/api-auth";
import { env } from "@/lib/config/env";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { name, email, password, organizationName } = body;

    if (!name || !email || !password || !organizationName) {
      return apiError("Missing required fields", "VALIDATION_ERROR", 400);
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail, isDeleted: false });
    if (existing) {
      return apiError("A user with this email already exists", "USER_EXISTS", 409);
    }

    // Create organization
    const slug = organizationName.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Math.floor(Math.random() * 1000);
    const org = await Organization.create({
      name: organizationName,
      slug,
      billingPlan: "starter",
    });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: cleanEmail,
      passwordHash,
      role: "Super Admin",
      organizationId: org._id,
      status: "active",
    });

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
