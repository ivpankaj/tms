import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { Deal, PipelineStage, Activity, Workflow } from "@/lib/db/models";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, errorResponse } = await authenticateRequest(req, "deals:read");
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const deal = await Deal.findOne({
    _id: id,
    organizationId: auth!.organizationId,
    isDeleted: false,
  })
    .populate("pipelineId", "name")
    .populate("stageId", "name probability color isWon isLost")
    .populate("companyId", "name domain phone industry")
    .populate("contactId", "firstName lastName email phone title")
    .populate("assignedTo", "name email avatar");

  if (!deal) {
    return apiError("Deal not found", "NOT_FOUND", 404);
  }

  return apiSuccess(deal);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, errorResponse } = await authenticateRequest(req, "deals:write");
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const body = await req.json();

    const existingDeal = await Deal.findOne({
      _id: id,
      organizationId: auth!.organizationId,
      isDeleted: false,
    });

    if (!existingDeal) {
      return apiError("Deal not found", "NOT_FOUND", 404);
    }

    const updates: any = {};
    const allowedFields = [
      "title",
      "value",
      "currency",
      "pipelineId",
      "stageId",
      "companyId",
      "contactId",
      "assignedTo",
      "probability",
      "expectedCloseDate",
      "winLossReason",
      "products",
      "customFields",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    // Check if stage changed
    let stageChanged = false;
    let oldStageName = "";
    let newStageName = "";

    if (body.stageId && body.stageId.toString() !== existingDeal.stageId?.toString()) {
      stageChanged = true;
      const [oldStage, newStage] = await Promise.all([
        PipelineStage.findById(existingDeal.stageId),
        PipelineStage.findById(body.stageId),
      ]);
      oldStageName = oldStage?.name || "Previous Stage";
      newStageName = newStage?.name || "New Stage";

      // If probability wasn't explicitly supplied, set to stage probability
      if (body.probability === undefined && newStage) {
        updates.probability = newStage.probability;
      }
    }

    const updatedDeal = await Deal.findOneAndUpdate(
      { _id: id, organizationId: auth!.organizationId },
      { $set: updates },
      { new: true }
    )
      .populate("pipelineId", "name")
      .populate("stageId", "name probability color isWon isLost")
      .populate("companyId", "name domain")
      .populate("contactId", "firstName lastName email")
      .populate("assignedTo", "name email");

    // Log Activity if stage changed or if updated
    if (stageChanged) {
      await Activity.create({
        organizationId: auth!.organizationId,
        type: "stage_change",
        title: "Deal Stage Moved",
        details: `Moved deal stage from "${oldStageName}" to "${newStageName}"${
          body.winLossReason ? ` (Reason: ${body.winLossReason})` : ""
        }`,
        entityType: "deal",
        entityId: id,
        createdBy: auth!.user._id,
      });

      // Run any active stage_change workflows
      const workflows = await Workflow.find({
        organizationId: auth!.organizationId,
        isActive: true,
        "trigger.event": "deal.stage_changed",
        isDeleted: false,
      });

      for (const wf of workflows) {
        const trigConfig = (wf.trigger as any)?.config;
        if (
          !trigConfig?.toStageId ||
          trigConfig.toStageId === body.stageId.toString()
        ) {
          await Activity.create({
            organizationId: auth!.organizationId,
            type: "note",
            title: `Workflow Executed: ${wf.name}`,
            details: `Automated action triggered upon entering stage "${newStageName}"`,
            entityType: "deal",
            entityId: id,
            createdBy: auth!.user._id,
          });
        }
      }
    } else {
      await Activity.create({
        organizationId: auth!.organizationId,
        type: "note",
        title: "Deal Updated",
        details: `Deal details updated`,
        entityType: "deal",
        entityId: id,
        createdBy: auth!.user._id,
      });
    }

    return apiSuccess(updatedDeal);
  } catch (err: any) {
    return apiError(err.message || "Failed to update deal", "DATABASE_ERROR", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, errorResponse } = await authenticateRequest(req, "deals:delete");
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const deal = await Deal.findOneAndUpdate(
    { _id: id, organizationId: auth!.organizationId, isDeleted: false },
    { $set: { isDeleted: true } },
    { new: true }
  );

  if (!deal) {
    return apiError("Deal not found", "NOT_FOUND", 404);
  }

  await Activity.create({
    organizationId: auth!.organizationId,
    type: "status_change",
    title: "Deal Deleted",
    details: `Deal "${deal.title}" was soft-deleted`,
    entityType: "deal",
    entityId: id,
    createdBy: auth!.user._id,
  });

  return apiSuccess({ deleted: true, id });
}
