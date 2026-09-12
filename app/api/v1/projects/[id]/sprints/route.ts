import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { Sprint, Task, Activity } from "@/lib/db/models";

// GET /api/v1/projects/[id]/sprints - List sprints for a project
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { auth, errorResponse } = await authenticateRequest(req, "projects:read");
  if (errorResponse) return errorResponse;

  try {
    const sprints = await Sprint.find({
      projectId: id,
      organizationId: auth!.organizationId,
      isDeleted: false,
    }).sort({ createdAt: -1 });

    // Enhance each sprint with computed task & story point metrics
    const sprintsWithMetrics = await Promise.all(
      sprints.map(async (sprint) => {
        const tasks = await Task.find({
          sprintId: sprint._id,
          organizationId: auth!.organizationId,
          isDeleted: false,
        });

        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((t) => t.status === "Done" || t.status === "Completed").length;
        const totalStoryPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
        const completedStoryPoints = tasks
          .filter((t) => t.status === "Done" || t.status === "Completed")
          .reduce((sum, t) => sum + (t.storyPoints || 0), 0);

        return {
          ...sprint.toObject(),
          totalTasks,
          completedTasks,
          totalStoryPoints,
          completedStoryPoints,
          progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        };
      })
    );

    return apiSuccess(sprintsWithMetrics);
  } catch (err: any) {
    return apiError(err.message || "Failed to fetch sprints", "DATABASE_ERROR", 500);
  }
}

// POST /api/v1/projects/[id]/sprints - Create sprint or trigger sprint actions
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { auth, errorResponse } = await authenticateRequest(req, "projects:write");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { action, sprintId, name, goal, startDate, endDate, durationWeeks = 2 } = body;

    // Handle sprint state actions (Start Sprint / Complete Sprint)
    if (action === "start" && sprintId) {
      // Check if there is already an active sprint
      const existingActive = await Sprint.findOne({
        projectId: id,
        organizationId: auth!.organizationId,
        status: "active",
        isDeleted: false,
      });
      if (existingActive) {
        return apiError("Another sprint is already active. Please complete it first.", "BAD_REQUEST", 400);
      }

      const sprint = await Sprint.findOneAndUpdate(
        { _id: sprintId, organizationId: auth!.organizationId },
        {
          status: "active",
          startDate: startDate ? new Date(startDate) : new Date(),
          endDate: endDate ? new Date(endDate) : new Date(Date.now() + durationWeeks * 7 * 24 * 60 * 60 * 1000),
        },
        { new: true }
      );

      await Activity.create({
        organizationId: auth!.organizationId,
        entityType: "project",
        entityId: id,
        type: "status_change",
        title: `Started sprint ${sprint?.name}`,
        details: sprint?.goal || "Sprint is now active",
        createdBy: auth!.user._id,
      });

      return apiSuccess(sprint);
    }

    if (action === "complete" && sprintId) {
      const sprintTasks = await Task.find({
        sprintId,
        organizationId: auth!.organizationId,
        isDeleted: false,
      });

      const completedStoryPoints = sprintTasks
        .filter((t) => t.status === "Done" || t.status === "Completed")
        .reduce((sum, t) => sum + (t.storyPoints || 0), 0);

      const sprint = await Sprint.findOneAndUpdate(
        { _id: sprintId, organizationId: auth!.organizationId },
        {
          status: "completed",
          velocity: completedStoryPoints,
          endDate: new Date(),
        },
        { new: true }
      );

      // Roll incomplete tasks back to backlog if requested
      if (body.rollOverIncomplete) {
        await Task.updateMany(
          {
            sprintId,
            status: { $nin: ["Done", "Completed"] },
            organizationId: auth!.organizationId,
          },
          { $unset: { sprintId: 1 } }
        );
      }

      await Activity.create({
        organizationId: auth!.organizationId,
        entityType: "project",
        entityId: id,
        type: "status_change",
        title: `Completed sprint ${sprint?.name}`,
        details: `Delivered ${completedStoryPoints} story points`,
        createdBy: auth!.user._id,
      });

      return apiSuccess(sprint);
    }

    // Default: Create new Sprint
    if (!name?.trim()) {
      return apiError("Sprint name is required", "VALIDATION_ERROR", 400);
    }

    const newSprint = await Sprint.create({
      organizationId: auth!.organizationId,
      projectId: id,
      name: name.trim(),
      goal: goal?.trim(),
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      status: "planning",
      createdBy: auth!.user._id,
    });

    return apiSuccess(newSprint, undefined, 201);
  } catch (err: any) {
    return apiError(err.message || "Failed to handle sprint", "DATABASE_ERROR", 500);
  }
}
