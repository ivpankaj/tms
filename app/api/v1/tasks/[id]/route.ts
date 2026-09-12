import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { Task, Activity, Notification, Project } from "@/lib/db/models";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, errorResponse } = await authenticateRequest(req, "tasks:read");
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const task = await Task.findOne({
    _id: id,
    organizationId: auth!.organizationId,
    isDeleted: false,
  })
    .populate("assignedTo", "name email avatar")
    .populate("reporterId", "name email avatar")
    .populate("projectId", "name key color")
    .populate("teamId", "name color")
    .populate("dependencies.taskId", "title status priority");

  if (!task) {
    return apiError("Task not found", "NOT_FOUND", 404);
  }

  return apiSuccess(task);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, errorResponse } = await authenticateRequest(req, "tasks:write");
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const body = await req.json();

    const task = await Task.findOne({
      _id: id,
      organizationId: auth!.organizationId,
      isDeleted: false,
    });

    if (!task) {
      return apiError("Task not found", "NOT_FOUND", 404);
    }

    const updates: any = {};
    const allowed = [
      "title",
      "description",
      "projectId",
      "teamId",
      "startDate",
      "dueDate",
      "priority",
      "status",
      "assignedTo",
      "labels",
      "estimatedHours",
      "actualHours",
      "parentTaskId",
      "subtasks",
      "checklist",
      "dependencies",
      "isPersonal",
      "recurring",
      "order",
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

    // Check status change activity
    if (body.status && body.status !== task.status) {
      await Activity.create({
        organizationId: auth!.organizationId,
        type: body.status === "Done" || body.status === "Completed" ? "completed" : "status_change",
        title: body.status === "Done" || body.status === "Completed" ? "Task Completed" : "Task Status Updated",
        details: `Task status changed from "${task.status}" to "${body.status}"`,
        entityType: "task",
        entityId: task._id,
        createdBy: auth!.user._id,
      });

      // If assigned to someone else, notify them
      if (task.assignedTo && task.assignedTo.toString() !== auth!.user._id.toString()) {
        await Notification.create({
          organizationId: auth!.organizationId,
          userId: task.assignedTo,
          title: "Task Status Updated",
          message: `${auth!.user.name} changed status of "${task.title}" to ${body.status}`,
          type: "task",
          link: `/tasks?selected=${task._id}`,
          createdBy: auth!.user._id,
        });
      }
    }

    // Check priority change activity
    if (body.priority && body.priority !== task.priority) {
      await Activity.create({
        organizationId: auth!.organizationId,
        type: "priority_change",
        title: "Task Priority Updated",
        details: `Task priority changed from "${task.priority}" to "${body.priority}"`,
        entityType: "task",
        entityId: task._id,
        createdBy: auth!.user._id,
      });
    }

    // Check assignee change
    if (body.assignedTo && body.assignedTo.toString() !== (task.assignedTo?.toString() || "")) {
      await Activity.create({
        organizationId: auth!.organizationId,
        type: "assigned",
        title: "Task Reassigned",
        details: `Task assigned to new owner`,
        entityType: "task",
        entityId: task._id,
        createdBy: auth!.user._id,
      });

      if (body.assignedTo.toString() !== auth!.user._id.toString()) {
        await Notification.create({
          organizationId: auth!.organizationId,
          userId: body.assignedTo,
          title: "Task Assigned",
          message: `${auth!.user.name} assigned you the task: "${task.title}"`,
          type: "task",
          link: `/tasks?selected=${task._id}`,
          createdBy: auth!.user._id,
        });
      }
    }

    const updatedTask = await Task.findOneAndUpdate(
      { _id: id, organizationId: auth!.organizationId },
      { $set: updates },
      { new: true }
    )
      .populate("assignedTo", "name email avatar")
      .populate("reporterId", "name email avatar")
      .populate("projectId", "name key color")
      .populate("teamId", "name color");

    // Recalculate project progress if linked to project
    const projId = updatedTask?.projectId || task.projectId;
    if (projId) {
      const [totalProjectTasks, completedProjectTasks] = await Promise.all([
        Task.countDocuments({ projectId: projId, isDeleted: false }),
        Task.countDocuments({
          projectId: projId,
          status: { $in: ["Done", "Completed"] },
          isDeleted: false,
        }),
      ]);
      const newProgress =
        totalProjectTasks > 0
          ? Math.round((completedProjectTasks / totalProjectTasks) * 100)
          : 0;
      await Project.findByIdAndUpdate(projId, { progress: newProgress });
    }

    return apiSuccess(updatedTask);
  } catch (err: any) {
    console.error("[Task Update Error]:", err);
    return apiError(err.message || "Failed to update task", "DATABASE_ERROR", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, errorResponse } = await authenticateRequest(req, "tasks:delete");
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const task = await Task.findOneAndUpdate(
    { _id: id, organizationId: auth!.organizationId, isDeleted: false },
    { $set: { isDeleted: true } },
    { new: true }
  );

  if (!task) {
    return apiError("Task not found", "NOT_FOUND", 404);
  }

  // Recalculate project progress if linked to project
  if (task.projectId) {
    const [totalProjectTasks, completedProjectTasks] = await Promise.all([
      Task.countDocuments({ projectId: task.projectId, isDeleted: false }),
      Task.countDocuments({
        projectId: task.projectId,
        status: { $in: ["Done", "Completed"] },
        isDeleted: false,
      }),
    ]);
    const newProgress =
      totalProjectTasks > 0
        ? Math.round((completedProjectTasks / totalProjectTasks) * 100)
        : 0;
    await Project.findByIdAndUpdate(task.projectId, { progress: newProgress });
  }

  return apiSuccess({ deleted: true, id });
}
