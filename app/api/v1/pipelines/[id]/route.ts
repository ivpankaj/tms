import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { Pipeline, PipelineStage } from "@/lib/db/models";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, errorResponse } = await authenticateRequest(req, "deals:read");
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const pipeline = await Pipeline.findOne({
    _id: id,
    organizationId: auth!.organizationId,
    isDeleted: false,
  });

  if (!pipeline) {
    return apiError("Pipeline not found", "NOT_FOUND", 404);
  }

  const stages = await PipelineStage.find({
    pipelineId: id,
    organizationId: auth!.organizationId,
    isDeleted: false,
  }).sort({ order: 1 });

  return apiSuccess({
    ...pipeline.toObject(),
    stages,
  });
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
    const { name, isDefault, stages } = body;

    const pipeline = await Pipeline.findOne({
      _id: id,
      organizationId: auth!.organizationId,
      isDeleted: false,
    });

    if (!pipeline) {
      return apiError("Pipeline not found", "NOT_FOUND", 404);
    }

    if (name) pipeline.name = name;
    if (isDefault !== undefined) {
      if (isDefault) {
        // unset default on others
        await Pipeline.updateMany(
          { organizationId: auth!.organizationId },
          { $set: { isDefault: false } }
        );
      }
      pipeline.isDefault = isDefault;
    }
    await pipeline.save();

    // If stages are updated or reordered
    if (stages && Array.isArray(stages)) {
      for (const st of stages) {
        if (st._id) {
          await PipelineStage.findOneAndUpdate(
            { _id: st._id, pipelineId: id, organizationId: auth!.organizationId },
            {
              $set: {
                name: st.name,
                order: st.order,
                probability: st.probability,
                color: st.color,
                isWon: st.isWon,
                isLost: st.isLost,
              },
            }
          );
        } else if (st.name) {
          // New stage
          await PipelineStage.create({
            pipelineId: id,
            organizationId: auth!.organizationId,
            name: st.name,
            order: st.order || 99,
            probability: st.probability !== undefined ? st.probability : 20,
            color: st.color || "#3b82f6",
            isWon: st.isWon || false,
            isLost: st.isLost || false,
            createdBy: auth!.user._id,
          });
        }
      }
    }

    const updatedStages = await PipelineStage.find({
      pipelineId: id,
      organizationId: auth!.organizationId,
      isDeleted: false,
    }).sort({ order: 1 });

    return apiSuccess({
      ...pipeline.toObject(),
      stages: updatedStages,
    });
  } catch (err: any) {
    return apiError(err.message || "Failed to update pipeline", "DATABASE_ERROR", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, errorResponse } = await authenticateRequest(req, "deals:delete");
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const pipeline = await Pipeline.findOneAndUpdate(
    { _id: id, organizationId: auth!.organizationId, isDeleted: false },
    { $set: { isDeleted: true } },
    { new: true }
  );

  if (!pipeline) {
    return apiError("Pipeline not found", "NOT_FOUND", 404);
  }

  return apiSuccess({ deleted: true, id });
}
