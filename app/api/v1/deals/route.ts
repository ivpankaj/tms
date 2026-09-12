import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError, parsePagination } from "@/lib/auth/api-auth";
import { Deal, Pipeline, PipelineStage, Activity, Workflow } from "@/lib/db/models";

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req, "deals:read");
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const pipelineId = searchParams.get("pipelineId");
  const stageId = searchParams.get("stageId");
  const view = searchParams.get("view"); // 'kanban' or 'list'
  const { page, limit, skip, search, sortOptions } = parsePagination(req);

  const query: any = {
    organizationId: auth!.organizationId,
    isDeleted: false,
  };

  if (pipelineId) query.pipelineId = pipelineId;
  if (stageId) query.stageId = stageId;

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { winLossReason: { $regex: search, $options: "i" } },
    ];
  }

  // If view is kanban, fetch all active deals in pipeline to render the columns
  if (view === "kanban") {
    let activePipelineId = pipelineId;
    if (!activePipelineId) {
      const defaultPipe = await Pipeline.findOne({
        organizationId: auth!.organizationId,
        isDefault: true,
        isDeleted: false,
      });
      activePipelineId = defaultPipe?._id ? defaultPipe._id.toString() : "";
    }

    const [stages, deals] = await Promise.all([
      PipelineStage.find({
        pipelineId: activePipelineId,
        organizationId: auth!.organizationId,
        isDeleted: false,
      }).sort({ order: 1 }),
      Deal.find({
        pipelineId: activePipelineId,
        organizationId: auth!.organizationId,
        isDeleted: false,
      })
        .populate("companyId", "name domain")
        .populate("contactId", "firstName lastName email")
        .populate("assignedTo", "name email")
        .sort({ updatedAt: -1 }),
    ]);

    // Group deals by stageId
    const columns = stages.map((st) => {
      const stageDeals = deals.filter((d) => d.stageId.toString() === st._id.toString());
      const stageTotal = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);
      const stageWeighted = stageDeals.reduce((sum, d) => sum + (d.value * (d.probability / 100)), 0);

      return {
        stage: st,
        deals: stageDeals,
        totalValue: stageTotal,
        weightedValue: stageWeighted,
        count: stageDeals.length,
      };
    });

    const totalPipelineValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);
    const totalWeightedForecast = deals.reduce((sum, d) => sum + (d.value * (d.probability / 100)), 0);

    return apiSuccess({
      pipelineId: activePipelineId,
      columns,
      totalPipelineValue,
      totalWeightedForecast,
      totalDeals: deals.length,
    });
  }

  // Otherwise standard paginated list
  const [items, total] = await Promise.all([
    Deal.find(query)
      .populate("pipelineId", "name")
      .populate("stageId", "name probability color isWon isLost")
      .populate("companyId", "name domain")
      .populate("contactId", "firstName lastName email")
      .populate("assignedTo", "name email")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit),
    Deal.countDocuments(query),
  ]);

  return apiSuccess(items, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req, "deals:write");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const {
      title,
      value,
      currency = "USD",
      pipelineId,
      stageId,
      companyId,
      contactId,
      assignedTo,
      probability,
      expectedCloseDate,
      products,
      customFields,
    } = body;

    if (!title || value === undefined) {
      return apiError("Deal title and value are required", "VALIDATION_ERROR", 400);
    }

    // Default pipeline & stage if not provided
    let pId = pipelineId;
    let sId = stageId;
    let prob = probability;

    if (!pId) {
      const defaultPipe = await Pipeline.findOne({
        organizationId: auth!.organizationId,
        isDefault: true,
        isDeleted: false,
      });
      pId = defaultPipe?._id;
    }

    if (!sId && pId) {
      const firstStage = await PipelineStage.findOne({
        pipelineId: pId,
        organizationId: auth!.organizationId,
        isDeleted: false,
      }).sort({ order: 1 });
      sId = firstStage?._id;
      if (prob === undefined && firstStage) {
        prob = firstStage.probability;
      }
    }

    const deal = await Deal.create({
      organizationId: auth!.organizationId,
      title,
      value: Number(value),
      currency,
      pipelineId: pId,
      stageId: sId,
      companyId: companyId || undefined,
      contactId: contactId || undefined,
      assignedTo: assignedTo || auth!.user._id,
      probability: prob !== undefined ? Number(prob) : 20,
      expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : undefined,
      products: products || [],
      customFields: customFields || {},
      createdBy: auth!.user._id,
    });

    // Log Activity
    await Activity.create({
      organizationId: auth!.organizationId,
      type: "note",
      title: "Deal Created",
      details: `Created new deal: ${title} (${currency} ${value})`,
      entityType: "deal",
      entityId: deal._id,
      createdBy: auth!.user._id,
    });

    const populated = await Deal.findById(deal._id)
      .populate("pipelineId", "name")
      .populate("stageId", "name probability color isWon isLost")
      .populate("companyId", "name domain")
      .populate("contactId", "firstName lastName email")
      .populate("assignedTo", "name email");

    return apiSuccess(populated, undefined, 201);
  } catch (err: any) {
    return apiError(err.message || "Failed to create deal", "DATABASE_ERROR", 500);
  }
}
