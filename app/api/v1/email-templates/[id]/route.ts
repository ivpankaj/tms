import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { EmailTemplate } from "@/lib/db/models";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const template = await EmailTemplate.findOne({
    _id: id,
    organizationId: auth!.organizationId,
    isDeleted: false,
  });

  if (!template) {
    return apiError("Template not found", "NOT_FOUND", 404);
  }

  return apiSuccess(template);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const body = await req.json();

    const allowed = ["name", "subject", "bodyHtml", "variables", "category"];
    const updates: any = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    const updated = await EmailTemplate.findOneAndUpdate(
      { _id: id, organizationId: auth!.organizationId, isDeleted: false },
      { $set: updates },
      { new: true }
    );

    if (!updated) {
      return apiError("Template not found", "NOT_FOUND", 404);
    }

    return apiSuccess(updated);
  } catch (err: any) {
    return apiError(err.message || "Failed to update template", "DATABASE_ERROR", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const template = await EmailTemplate.findOneAndUpdate(
    { _id: id, organizationId: auth!.organizationId, isDeleted: false },
    { $set: { isDeleted: true } },
    { new: true }
  );

  if (!template) {
    return apiError("Template not found", "NOT_FOUND", 404);
  }

  return apiSuccess({ deleted: true, id });
}
