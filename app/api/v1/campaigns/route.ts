import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError, parsePagination } from "@/lib/auth/api-auth";
import { Campaign } from "@/lib/db/models";

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req, "campaigns:read");
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const { page, limit, skip, search, sortOptions } = parsePagination(req);

  const query: any = {
    organizationId: auth!.organizationId,
    isDeleted: false,
  };

  if (status) query.status = status;
  if (type) query.type = type;
  if (search) query.name = { $regex: search, $options: "i" };

  const [campaigns, total] = await Promise.all([
    Campaign.find(query)
      .populate("templateId", "name subject")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit),
    Campaign.countDocuments(query),
  ]);

  return apiSuccess(campaigns, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req, "campaigns:write");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { name, type = "email", status = "Draft", segmentFilter, templateId, scheduledAt } = body;

    if (!name) {
      return apiError("Campaign name is required", "VALIDATION_ERROR", 400);
    }

    const campaign = await Campaign.create({
      organizationId: auth!.organizationId,
      name,
      type,
      status,
      segmentFilter: segmentFilter || {},
      templateId: templateId || undefined,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      metrics: {
        sent: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
      },
      createdBy: auth!.user._id,
    });

    const populated = await Campaign.findById(campaign._id).populate("templateId", "name subject");

    return apiSuccess(populated, undefined, 201);
  } catch (err: any) {
    return apiError(err.message || "Failed to create campaign", "DATABASE_ERROR", 500);
  }
}
