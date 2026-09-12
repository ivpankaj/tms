import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { Workflow } from "@/lib/db/models";

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req, "settings:read");
  if (errorResponse) return errorResponse;

  const workflows = await Workflow.find({
    organizationId: auth!.organizationId,
    isDeleted: false,
  }).sort({ createdAt: -1 });

  return apiSuccess(workflows);
}

export async function POST(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req, "settings:write");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { name, description, trigger, conditions = [], actions = [], isActive = true } = body;

    if (!name || !trigger || !actions.length) {
      return apiError(
        "Name, trigger, and at least one action are required",
        "VALIDATION_ERROR",
        400
      );
    }

    const workflow = await Workflow.create({
      organizationId: auth!.organizationId,
      name,
      description,
      trigger: {
        event: trigger.event || "deal.stage_changed",
        conditions: trigger.conditions || [],
        config: trigger.config || {},
      },
      conditions: conditions || [],
      actions: actions || [],
      isActive: isActive !== undefined ? isActive : true,
      createdBy: auth!.user._id,
    } as any);

    return apiSuccess(workflow, undefined, 201);
  } catch (err: any) {
    return apiError(err.message || "Failed to create workflow", "DATABASE_ERROR", 500);
  }
}
