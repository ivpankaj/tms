import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { AuditLog } from "@/lib/db/models";
import { isDefaultPlatformAdmin } from "@/lib/config/env";

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req, "settings:read");
  if (errorResponse) return errorResponse;

  if (!isDefaultPlatformAdmin(auth!.user.email)) {
    return apiError("Access restricted to platform administrator", "FORBIDDEN", 403);
  }

  try {
    const logs = await AuditLog.find({
      organizationId: auth!.organizationId,
    })
      .populate("userId", "name email role avatar")
      .sort({ createdAt: -1 })
      .limit(50);

    return apiSuccess(logs);
  } catch (err: any) {
    return apiError(err.message || "Failed to fetch audit logs", "DATABASE_ERROR", 500);
  }
}
