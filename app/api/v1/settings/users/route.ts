import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { User, AuditLog } from "@/lib/db/models";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req, "settings:read");
  if (errorResponse) return errorResponse;

  const users = await User.find({
    organizationId: auth!.organizationId,
    isDeleted: false,
  })
    .select("-passwordHash")
    .sort({ createdAt: 1 });

  return apiSuccess(users);
}

export async function POST(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req, "settings:write");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { email, name, role = "Sales Rep", timezone = "America/New_York", temporaryPassword = "Password123!" } = body;

    if (!email || !name) {
      return apiError("Email and name are required", "VALIDATION_ERROR", 400);
    }

    const existing = await User.findOne({
      email: email.toLowerCase().trim(),
      organizationId: auth!.organizationId,
      isDeleted: false,
    });

    if (existing) {
      return apiError("User with this email already exists in organization", "ALREADY_EXISTS", 400);
    }

    const passwordHash = await bcrypt.hash(temporaryPassword, 10);
    const user = await User.create({
      organizationId: auth!.organizationId,
      email: email.toLowerCase().trim(),
      name,
      role,
      timezone,
      passwordHash,
      status: "active" as const,
      createdBy: auth!.user._id,
    }) as any;

    await AuditLog.create({
      organizationId: auth!.organizationId,
      userId: auth!.user._id,
      action: "INVITE_USER",
      entityType: "user",
      entityId: user._id,
      changes: { email, name, role },
    });

    const userObj = user.toObject();
    delete userObj.passwordHash;

    return apiSuccess(userObj, undefined, 201);
  } catch (err: any) {
    return apiError(err.message || "Failed to invite user", "DATABASE_ERROR", 500);
  }
}
