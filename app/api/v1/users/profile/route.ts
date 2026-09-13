import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { User, AuditLog } from "@/lib/db/models";

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  const user = await User.findById(auth!.user._id).select("-passwordHash");
  if (!user) {
    return apiError("User not found", "NOT_FOUND", 404);
  }

  return apiSuccess(user);
}

export async function PATCH(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { name, avatar, timezone } = body;

    const updates: any = {};
    if (typeof name === "string" && name.trim()) {
      updates.name = name.trim();
    }
    if (typeof avatar === "string") {
      updates.avatar = avatar.trim();
    }
    if (typeof timezone === "string" && timezone.trim()) {
      updates.timezone = timezone.trim();
    }

    if (Object.keys(updates).length === 0) {
      return apiError("No valid fields provided to update", "VALIDATION_ERROR", 400);
    }

    const updated = await User.findByIdAndUpdate(
      auth!.user._id,
      { $set: updates },
      { new: true }
    ).select("-passwordHash");

    await AuditLog.create({
      organizationId: auth!.organizationId,
      userId: auth!.user._id,
      action: "UPDATE_PROFILE",
      entityType: "user",
      entityId: auth!.user._id,
      changes: updates,
    });

    return apiSuccess(updated);
  } catch (err: any) {
    return apiError(err.message || "Failed to update profile", "DATABASE_ERROR", 500);
  }
}
