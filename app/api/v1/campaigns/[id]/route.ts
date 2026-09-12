import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { Campaign } from "@/lib/db/models";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, errorResponse } = await authenticateRequest(req, "campaigns:read");
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const campaign = await Campaign.findOne({
    _id: id,
    organizationId: auth!.organizationId,
    isDeleted: false,
  }).populate("templateId", "name subject bodyHtml variables");

  if (!campaign) {
    return apiError("Campaign not found", "NOT_FOUND", 404);
  }

  return apiSuccess(campaign);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, errorResponse } = await authenticateRequest(req, "campaigns:write");
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const body = await req.json();

    const allowed = ["name", "type", "status", "segmentFilter", "templateId", "scheduledAt", "metrics"];
    const updates: any = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    const updated = await Campaign.findOneAndUpdate(
      { _id: id, organizationId: auth!.organizationId, isDeleted: false },
      { $set: updates },
      { new: true }
    ).populate("templateId", "name subject");

    if (!updated) {
      return apiError("Campaign not found", "NOT_FOUND", 404);
    }

    return apiSuccess(updated);
  } catch (err: any) {
    return apiError(err.message || "Failed to update campaign", "DATABASE_ERROR", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, errorResponse } = await authenticateRequest(req, "campaigns:write");
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const campaign = await Campaign.findOneAndUpdate(
    { _id: id, organizationId: auth!.organizationId, isDeleted: false },
    { $set: { isDeleted: true } },
    { new: true }
  );

  if (!campaign) {
    return apiError("Campaign not found", "NOT_FOUND", 404);
  }

  return apiSuccess({ deleted: true, id });
}
