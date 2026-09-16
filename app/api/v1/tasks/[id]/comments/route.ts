import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { Comment, Task, Activity, Notification } from "@/lib/db/models";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, errorResponse } = await authenticateRequest(req, "comments:read");
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const comments = await Comment.find({
    taskId: id,
    organizationId: auth!.organizationId,
    isDeleted: false,
  })
    .populate("userId", "name email avatar role")
    .sort({ createdAt: 1 })
    .lean();

  return apiSuccess(comments);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, errorResponse } = await authenticateRequest(req, "comments:write");
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const body = await req.json();
    const commentBody = body.body?.trim();

    if (!commentBody) {
      return apiError("Comment body is required", "VALIDATION_ERROR", 400);
    }

    const task = await Task.findOne({
      _id: id,
      organizationId: auth!.organizationId,
      isDeleted: false,
    });

    if (!task) {
      return apiError("Task not found", "NOT_FOUND", 404);
    }

    const comment = await Comment.create({
      organizationId: auth!.organizationId,
      taskId: id,
      userId: auth!.user._id,
      body: commentBody,
      attachments: Array.isArray(body.attachments) ? body.attachments : [],
      createdBy: auth!.user._id,
    });

    // Log activity
    await Activity.create({
      organizationId: auth!.organizationId,
      type: "comment",
      title: "Comment Added",
      details: `${auth!.user.name} commented on "${task.title}"`,
      entityType: "task",
      entityId: task._id,
      createdBy: auth!.user._id,
    });

    // Notify task assignee if not the commenter
    if (task.assignedTo && task.assignedTo.toString() !== auth!.user._id.toString()) {
      await Notification.create({
        organizationId: auth!.organizationId,
        userId: task.assignedTo,
        title: "New Comment",
        message: `${auth!.user.name} commented on "${task.title}": "${commentBody.slice(0, 80)}${commentBody.length > 80 ? "..." : ""}"`,
        type: "task",
        link: `/tasks?selected=${task._id}`,
        createdBy: auth!.user._id,
      });
    }

    const populated = await Comment.findById(comment._id)
      .populate("userId", "name email avatar role")
      .lean();

    return apiSuccess(populated, undefined, 201);
  } catch (err: any) {
    console.error("[Create Comment Error]:", err);
    return apiError(err.message || "Failed to create comment", "DATABASE_ERROR", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, errorResponse } = await authenticateRequest(req, "comments:delete");
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get("commentId");

    if (!commentId) {
      return apiError("commentId parameter is required", "VALIDATION_ERROR", 400);
    }

    const comment = await Comment.findOne({
      _id: commentId,
      organizationId: auth!.organizationId,
      isDeleted: false,
    });

    if (!comment) {
      return apiError("Comment not found", "NOT_FOUND", 404);
    }

    // Only allow author or Super Admin/Admin to delete
    const isAuthor = comment.userId.toString() === auth!.user._id.toString();
    const isAdmin = auth!.user.role === "Super Admin" || auth!.user.role === "Admin";
    if (!isAuthor && !isAdmin) {
      return apiError("Forbidden: Cannot delete other users' comments", "FORBIDDEN", 403);
    }

    comment.isDeleted = true;
    await comment.save();

    return apiSuccess({ deleted: true, commentId });
  } catch (err: any) {
    return apiError(err.message || "Failed to delete comment", "DATABASE_ERROR", 500);
  }
}
