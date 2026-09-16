import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { Task, Activity } from "@/lib/db/models";

// GET /api/v1/tasks/[id]/timelogs - Get all time logs for a task
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { auth, errorResponse } = await authenticateRequest(req, "tasks:read");
  if (errorResponse) return errorResponse;

  try {
    const task = await Task.findOne({
      _id: id,
      organizationId: auth!.organizationId,
      isDeleted: false,
    })
      .select("estimatedHours actualHours timeLogs")
      .populate("timeLogs.userId", "name email avatar")
      .lean();

    if (!task) {
      return apiError("Task not found", "NOT_FOUND", 404);
    }

    return apiSuccess({
      estimatedHours: task.estimatedHours || 0,
      actualHours: task.actualHours || 0,
      timeLogs: (task.timeLogs || []).sort(
        (a: any, b: any) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()
      ),
    });
  } catch (err: any) {
    return apiError(err.message || "Failed to fetch time logs", "DATABASE_ERROR", 500);
  }
}

// POST /api/v1/tasks/[id]/timelogs - Log work hours
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { auth, errorResponse } = await authenticateRequest(req, "tasks:write");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { hours, description, loggedAt } = body;

    const parsedHours = parseFloat(hours);
    if (isNaN(parsedHours) || parsedHours <= 0) {
      return apiError("A positive number of hours is required", "VALIDATION_ERROR", 400);
    }

    const task = await Task.findOne({
      _id: id,
      organizationId: auth!.organizationId,
      isDeleted: false,
    });

    if (!task) {
      return apiError("Task not found", "NOT_FOUND", 404);
    }

    const newLog = {
      userId: auth!.user._id,
      hours: parsedHours,
      description: description?.trim() || "",
      loggedAt: loggedAt ? new Date(loggedAt) : new Date(),
    };

    task.timeLogs = task.timeLogs || [];
    task.timeLogs.push(newLog as any);
    task.actualHours = (task.actualHours || 0) + parsedHours;
    await task.save();

    // Log activity
    await Activity.create({
      organizationId: auth!.organizationId,
      entityType: "task",
      entityId: task._id,
      type: "note",
      title: `${auth!.user.name} logged ${parsedHours}h of work`,
      details: description || `Total time logged: ${task.actualHours}h`,
      createdBy: auth!.user._id,
    });

    const populatedTask = await Task.findById(task._id)
      .select("estimatedHours actualHours timeLogs")
      .populate("timeLogs.userId", "name email avatar")
      .lean();

    return apiSuccess(
      {
        actualHours: populatedTask?.actualHours || 0,
        estimatedHours: populatedTask?.estimatedHours || 0,
        timeLogs: populatedTask?.timeLogs || [],
      },
      undefined,
      201
    );
  } catch (err: any) {
    return apiError(err.message || "Failed to log time", "DATABASE_ERROR", 500);
  }
}
