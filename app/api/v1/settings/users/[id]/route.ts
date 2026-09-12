import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { User, AuditLog } from "@/lib/db/models";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, errorResponse } = await authenticateRequest(req, "settings:write");
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const body = await req.json();
    const { role, status, name, timezone } = body;

    const user = await User.findOne({
      _id: id,
      organizationId: auth!.organizationId,
      isDeleted: false,
    });

    if (!user) {
      return apiError("User not found", "NOT_FOUND", 404);
    }

    const updates: any = {};
    if (role) updates.role = role;
    if (status) updates.status = status;
    if (name) updates.name = name;
    if (timezone) updates.timezone = timezone;

    const updated = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    ).select("-passwordHash");

    await AuditLog.create({
      organizationId: auth!.organizationId,
      userId: auth!.user._id,
      action: "UPDATE_USER_ROLE_OR_STATUS",
      entityType: "user",
      entityId: id,
      changes: updates,
    });

    return apiSuccess(updated);
  } catch (err: any) {
    return apiError(err.message || "Failed to update user", "DATABASE_ERROR", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, errorResponse } = await authenticateRequest(req, "settings:write");
  if (errorResponse) return errorResponse;

  const { id } = await params;
  if (id === auth!.user._id.toString()) {
    return apiError("Cannot deactivate your own user account", "BAD_REQUEST", 400);
  }

  const user = await User.findOneAndUpdate(
    { _id: id, organizationId: auth!.organizationId, isDeleted: false },
    { $set: { isDeleted: true, status: "Inactive" } },
    { new: true }
  );

  if (!user) {
    return apiError("User not found", "NOT_FOUND", 404);
  }

  await AuditLog.create({
    organizationId: auth!.organizationId,
    userId: auth!.user._id,
    action: "DEACTIVATE_USER",
    entityType: "user",
    entityId: id,
    changes: { isDeleted: true, status: "Inactive" },
  });

  return apiSuccess({ deleted: true, id });
}
