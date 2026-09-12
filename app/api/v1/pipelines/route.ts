import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { Pipeline, PipelineStage } from "@/lib/db/models";

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req, "deals:read");
  if (errorResponse) return errorResponse;

  const pipelines = await Pipeline.find({
    organizationId: auth!.organizationId,
    isDeleted: false,
  }).sort({ isDefault: -1, createdAt: 1 });

  // Fetch stages for all pipelines
  const pipelinesWithStages = await Promise.all(
    pipelines.map(async (pipe) => {
      const stages = await PipelineStage.find({
        pipelineId: pipe._id,
        organizationId: auth!.organizationId,
        isDeleted: false,
      }).sort({ order: 1 });

      return {
        ...pipe.toObject(),
        stages,
      };
    })
  );

  return apiSuccess(pipelinesWithStages);
}

export async function POST(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req, "deals:write");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { name, stages } = body;

    if (!name || !stages || !Array.isArray(stages) || stages.length === 0) {
      return apiError("Pipeline name and at least one stage are required", "VALIDATION_ERROR", 400);
    }

    const pipeline = await Pipeline.create({
      organizationId: auth!.organizationId,
      name,
      isDefault: false,
      createdBy: auth!.user._id,
    });

    const createdStages = await Promise.all(
      stages.map((st: any, idx: number) =>
        PipelineStage.create({
          pipelineId: pipeline._id,
          organizationId: auth!.organizationId,
          name: st.name,
          order: st.order !== undefined ? st.order : idx,
          probability: st.probability !== undefined ? st.probability : 20,
          color: st.color || "#3b82f6",
          isWon: st.isWon || false,
          isLost: st.isLost || false,
          createdBy: auth!.user._id,
        })
      )
    );

    return apiSuccess(
      {
        ...pipeline.toObject(),
        stages: createdStages,
      },
      undefined,
      201
    );
  } catch (err: any) {
    return apiError(err.message || "Failed to create pipeline", "DATABASE_ERROR", 500);
  }
}
