import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { Project, Task, Activity } from "@/lib/db/models";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, errorResponse } = await authenticateRequest(req, "projects:read");
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const project = await Project.findOne({
    _id: id,
    organizationId: auth!.organizationId,
    isDeleted: false,
  })
    .populate("ownerId", "name email avatar")
    .populate("members", "name email avatar");

  if (!project) {
    return apiError("Project not found", "NOT_FOUND", 404);
  }

  // Real-time task metrics
  const [totalTasks, completedTasks, inProgressTasks, overdueTasks] = await Promise.all([
    Task.countDocuments({ projectId: id, isDeleted: false }),
    Task.countDocuments({
      projectId: id,
      status: { $in: ["Done", "Completed"] },
      isDeleted: false,
    }),
    Task.countDocuments({
      projectId: id,
      status: "In Progress",
      isDeleted: false,
    }),
    Task.countDocuments({
      projectId: id,
      dueDate: { $lt: new Date() },
      status: { $nin: ["Done", "Completed", "Cancelled"] },
      isDeleted: false,
    }),
  ]);

  const progress =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : project.progress || 0;

  const obj = project.toObject();
  return apiSuccess({
    ...obj,
    totalTasks,
    completedTasks,
    inProgressTasks,
    overdueTasks,
    progress,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, errorResponse } = await authenticateRequest(req, "projects:write");
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const body = await req.json();

    const project = await Project.findOne({
      _id: id,
      organizationId: auth!.organizationId,
      isDeleted: false,
    });

    if (!project) {
      return apiError("Project not found", "NOT_FOUND", 404);
    }

    const updates: any = {};
    const allowed = [
      "name",
      "key",
      "description",
      "ownerId",
      "members",
      "status",
      "priority",
      "startDate",
      "dueDate",
      "progress",
      "color",
      "tags",
      "milestones",
    ];

    for (const key of allowed) {
      if (body[key] !== undefined) {
        if (key === "dueDate" || key === "startDate") {
          updates[key] = body[key] ? new Date(body[key]) : null;
        } else {
          updates[key] = body[key];
        }
      }
    }

    if (body.status && body.status !== project.status) {
      await Activity.create({
        organizationId: auth!.organizationId,
        type: "status_change",
        title: "Project Status Changed",
        details: `Project "${project.name}" status changed to ${body.status}`,
        entityType: "project",
        entityId: project._id,
        createdBy: auth!.user._id,
      });
    }

    const updated = await Project.findOneAndUpdate(
      { _id: id, organizationId: auth!.organizationId },
      { $set: updates },
      { new: true }
    )
      .populate("ownerId", "name email avatar")
      .populate("members", "name email avatar");

    return apiSuccess(updated);
  } catch (err: any) {
    console.error("[Update Project Error]:", err);
    return apiError(err.message || "Failed to update project", "DATABASE_ERROR", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, errorResponse } = await authenticateRequest(req, "projects:delete");
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const project = await Project.findOneAndUpdate(
    { _id: id, organizationId: auth!.organizationId, isDeleted: false },
    { $set: { isDeleted: true } },
    { new: true }
  );

  if (!project) {
    return apiError("Project not found", "NOT_FOUND", 404);
  }

  return apiSuccess({ deleted: true, id });
}
