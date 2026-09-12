import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { Organization, User } from "@/lib/db/models";
import { signJwt } from "@/lib/auth/jwt";
import { env } from "@/lib/config/env";

export async function POST(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  const body = await req.json();
  const { organizationId } = body;

  if (!organizationId) {
    return apiError("organizationId is required", "VALIDATION_ERROR", 400);
  }

  // Find user account in the target organization
  let targetUser = await User.findOne({
    email: auth!.user.email,
    organizationId,
    isDeleted: false,
  });

  const targetOrg = await Organization.findOne({ _id: organizationId, isDeleted: false });
  if (!targetOrg) {
    return apiError("Target organization not found", "NOT_FOUND", 404);
  }

  // If user doesn't have an explicit account in targetOrg yet (e.g. Super Admin switching), create membership
  if (!targetUser) {
    targetUser = await User.create({
      email: auth!.user.email,
      passwordHash: auth!.user.passwordHash,
      name: auth!.user.name,
      role: auth!.user.role === "Super Admin" ? "Super Admin" : "Sales Rep",
      organizationId: targetOrg._id,
      timezone: auth!.user.timezone,
      status: "active",
    });
  }

  const token = signJwt({
    userId: targetUser._id.toString(),
    email: targetUser.email,
    name: targetUser.name,
    role: targetUser.role,
    organizationId: targetOrg._id.toString(),
  });

  const response = apiSuccess({
    organization: {
      id: targetOrg._id.toString(),
      name: targetOrg.name,
      slug: targetOrg.slug,
      currency: targetOrg.currency,
      billingPlan: targetOrg.billingPlan,
    },
  });

  response.cookies.set(env.auth.cookieName, token, {
    httpOnly: true,
    secure: env.app.isProduction,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return response;
}
