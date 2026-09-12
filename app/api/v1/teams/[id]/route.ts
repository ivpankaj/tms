import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { Team, Task } from "@/lib/db/models";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, errorResponse } = await authenticateRequest(req, "teams:read");
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const team = await Team.findOne({
    _id: id,
    organizationId: auth!.organizationId,
    isDeleted: false,
  })
    .populate("leaderId", "name email avatar")
    .populate("members", "name email avatar");

  if (!team) {
    return apiError("Team not found", "NOT_FOUND", 404);
  }

  const tasks = await Task.find({
    teamId: id,
    organizationId: auth!.organizationId,
    isDeleted: false,
  })
    .populate("assignedTo", "name email avatar")
    .populate("projectId", "name key color")
    .sort({ dueDate: 1 });

  return apiSuccess({
    ...team.toObject(),
    tasks,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, errorResponse } = await authenticateRequest(req, "teams:write");
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const body = await req.json();

    const team = await Team.findOne({
      _id: id,
      organizationId: auth!.organizationId,
      isDeleted: false,
    });

    if (!team) {
      return apiError("Team not found", "NOT_FOUND", 404);
    }

    const updates: any = {};
    const allowed = ["name", "description", "leaderId", "members", "color"];
    for (const key of allowed) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    const updated = await Team.findOneAndUpdate(
      { _id: id, organizationId: auth!.organizationId },
      { $set: updates },
      { new: true }
    )
      .populate("leaderId", "name email avatar")
      .populate("members", "name email avatar");

    return apiSuccess(updated);
  } catch (err: any) {
    return apiError(err.message || "Failed to update team", "DATABASE_ERROR", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, errorResponse } = await authenticateRequest(req, "teams:delete");
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const team = await Team.findOneAndUpdate(
    { _id: id, organizationId: auth!.organizationId, isDeleted: false },
    { $set: { isDeleted: true } },
    { new: true }
  );

  if (!team) {
    return apiError("Team not found", "NOT_FOUND", 404);
  }

  return apiSuccess({ deleted: true, id });
}
