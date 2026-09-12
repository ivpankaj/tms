import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { Organization, AuditLog } from "@/lib/db/models";

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req, "settings:read");
  if (errorResponse) return errorResponse;

  const org = await Organization.findById(auth!.organizationId);
  if (!org) {
    return apiError("Organization not found", "NOT_FOUND", 404);
  }

  return apiSuccess(org);
}

export async function PATCH(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req, "settings:write");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const allowed = ["name", "logo", "timezone", "currency", "fiscalYearStart", "settings"];
    const updates: any = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    const org = await Organization.findByIdAndUpdate(
      auth!.organizationId,
      { $set: updates },
      { new: true }
    );

    // Audit log
    await AuditLog.create({
      organizationId: auth!.organizationId,
      userId: auth!.user._id,
      action: "UPDATE_ORGANIZATION_SETTINGS",
      entityType: "organization",
      entityId: auth!.organizationId,
      changes: updates,
    });

    return apiSuccess(org);
  } catch (err: any) {
    return apiError(err.message || "Failed to update organization settings", "DATABASE_ERROR", 500);
  }
}
