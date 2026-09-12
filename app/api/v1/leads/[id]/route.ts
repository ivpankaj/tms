import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { Lead } from "@/lib/db/models";
import { calculateLeadScore } from "@/lib/utils/lead-scorer";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { auth, errorResponse } = await authenticateRequest(req, "leads:read");
  if (errorResponse) return errorResponse;

  const lead = await Lead.findOne({
    _id: id,
    organizationId: auth!.organizationId,
    isDeleted: false,
  }).populate("assignedTo", "name email");

  if (!lead) {
    return apiError("Lead not found", "NOT_FOUND", 404);
  }

  return apiSuccess(lead);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { auth, errorResponse } = await authenticateRequest(req, "leads:write");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    
    // Recalculate score if title/company/source changed
    if (body.title || body.company || body.source) {
      const existing = await Lead.findById(id);
      if (existing) {
        body.score = calculateLeadScore({
          title: body.title || existing.title,
          company: body.company || existing.company,
          source: body.source || existing.source,
          email: body.email || existing.email,
          phone: body.phone || existing.phone,
        });
      }
    }

    const lead = await Lead.findOneAndUpdate(
      { _id: id, organizationId: auth!.organizationId, isDeleted: false },
      { $set: body },
      { new: true }
    ).populate("assignedTo", "name email");

    if (!lead) {
      return apiError("Lead not found", "NOT_FOUND", 404);
    }

    return apiSuccess(lead);
  } catch (err: any) {
    return apiError(err.message || "Failed to update lead", "DATABASE_ERROR", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { auth, errorResponse } = await authenticateRequest(req, "leads:delete");
  if (errorResponse) return errorResponse;

  const lead = await Lead.findOneAndUpdate(
    { _id: id, organizationId: auth!.organizationId, isDeleted: false },
    { $set: { isDeleted: true } }
  );

  if (!lead) {
    return apiError("Lead not found", "NOT_FOUND", 404);
  }

  return apiSuccess({ deleted: true, id });
}
