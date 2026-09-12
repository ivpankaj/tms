import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { Workflow } from "@/lib/db/models";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, errorResponse } = await authenticateRequest(req, "settings:read");
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const workflow = await Workflow.findOne({
    _id: id,
    organizationId: auth!.organizationId,
    isDeleted: false,
  });

  if (!workflow) {
    return apiError("Workflow not found", "NOT_FOUND", 404);
  }

  return apiSuccess(workflow);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, errorResponse } = await authenticateRequest(req, "settings:write");
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const body = await req.json();

    const allowed = ["name", "description", "isActive", "trigger", "conditions", "actions"];
    const updates: any = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    const updated = await Workflow.findOneAndUpdate(
      { _id: id, organizationId: auth!.organizationId, isDeleted: false },
      { $set: updates },
      { new: true }
    );

    if (!updated) {
      return apiError("Workflow not found", "NOT_FOUND", 404);
    }

    return apiSuccess(updated);
  } catch (err: any) {
    return apiError(err.message || "Failed to update workflow", "DATABASE_ERROR", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, errorResponse } = await authenticateRequest(req, "settings:write");
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const workflow = await Workflow.findOneAndUpdate(
    { _id: id, organizationId: auth!.organizationId, isDeleted: false },
    { $set: { isDeleted: true } },
    { new: true }
  );

  if (!workflow) {
    return apiError("Workflow not found", "NOT_FOUND", 404);
  }

  return apiSuccess({ deleted: true, id });
}
