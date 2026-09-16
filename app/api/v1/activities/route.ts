import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { Activity } from "@/lib/db/models";

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const entityType = searchParams.get("entityType");
  const entityId = searchParams.get("entityId");
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  const query: any = {
    organizationId: auth!.organizationId,
    isDeleted: false,
  };

  if (entityType) query.entityType = entityType;
  if (entityId) query.entityId = entityId;

  const activities = await Activity.find(query)
    .populate("createdBy", "name email avatar")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return apiSuccess(activities);
}

export async function POST(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { type, title, details, entityType, entityId, metadata } = body;

    if (!type || !title || !entityType || !entityId) {
      return apiError(
        "type, title, entityType, and entityId are required",
        "VALIDATION_ERROR",
        400
      );
    }

    const activity = await Activity.create({
      organizationId: auth!.organizationId,
      type,
      title,
      details,
      entityType,
      entityId,
      metadata: metadata || {},
      createdBy: auth!.user._id,
    });

    const populated = await Activity.findById(activity._id)
      .populate("createdBy", "name email avatar")
      .lean();

    return apiSuccess(populated, undefined, 201);
  } catch (err: any) {
    return apiError(err.message || "Failed to log activity", "DATABASE_ERROR", 500);
  }
}
