import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { User, AuditLog } from "@/lib/db/models";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!newPassword || typeof newPassword !== "string") {
      return apiError("New password is required", "VALIDATION_ERROR", 400);
    }

    if (newPassword.length < 8) {
      return apiError("New password must be at least 8 characters long", "VALIDATION_ERROR", 400);
    }

    if (newPassword !== confirmPassword) {
      return apiError("New password and confirm password do not match", "VALIDATION_ERROR", 400);
    }

    const user = await User.findById(auth!.user._id);
    if (!user) {
      return apiError("User not found", "NOT_FOUND", 404);
    }

    // If user has a local password and is not a pure Google OAuth user setting a password for the first time
    const hasExistingPassword = Boolean(user.passwordHash);
    const isGoogleOnly = user.authProvider === "google" && !user.passwordHash;

    if (hasExistingPassword && !isGoogleOnly) {
      if (!currentPassword) {
        return apiError("Current password is required", "VALIDATION_ERROR", 400);
      }

      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return apiError("Incorrect current password", "INVALID_CREDENTIALS", 400);
      }
    }

    // Hash and save new password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = passwordHash;
    await user.save();

    await AuditLog.create({
      organizationId: auth!.organizationId,
      userId: auth!.user._id,
      action: "CHANGE_PASSWORD",
      entityType: "user",
      entityId: auth!.user._id,
      changes: { passwordChanged: true },
    });

    return apiSuccess({
      message: "Password changed successfully",
    });
  } catch (err: any) {
    return apiError(err.message || "Failed to change password", "DATABASE_ERROR", 500);
  }
}
