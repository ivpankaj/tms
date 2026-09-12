import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { Notification } from "@/lib/db/models";

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  const notifications = await Notification.find({
    organizationId: auth!.organizationId,
    userId: auth!.user._id,
  })
    .sort({ createdAt: -1 })
    .limit(30);

  // If none exist, generate demo notifications for the user
  if (notifications.length === 0) {
    const demoNotifications = await Notification.insertMany([
      {
        organizationId: auth!.organizationId,
        userId: auth!.user._id,
        title: "Deal Stage Updated",
        message: 'Deal "Cloud Infrastructure Expansion" moved to Negotiation',
        type: "deal",
        isRead: false,
        link: "/deals",
      },
      {
        organizationId: auth!.organizationId,
        userId: auth!.user._id,
        title: "Task Due Soon",
        message: "Prepare pitch deck for Enterprise Security deal is due today",
        type: "task",
        isRead: false,
        link: "/tasks",
      },
      {
        organizationId: auth!.organizationId,
        userId: auth!.user._id,
        title: "New High-Value Lead",
        message: "Sarah Jenkins from Apex Systems submitted contact form (Score: 85)",
        type: "lead",
        isRead: true,
        link: "/leads",
      },
    ]);
    return apiSuccess(demoNotifications);
  }

  return apiSuccess(notifications);
}

export async function PATCH(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { id, markAllAsRead } = body;

    if (markAllAsRead) {
      await Notification.updateMany(
        { organizationId: auth!.organizationId, userId: auth!.user._id },
        { $set: { isRead: true } }
      );
      return apiSuccess({ success: true, message: "All marked as read" });
    }

    if (id) {
      await Notification.findOneAndUpdate(
        { _id: id, organizationId: auth!.organizationId, userId: auth!.user._id },
        { $set: { isRead: true } }
      );
      return apiSuccess({ success: true, id });
    }

    return apiError("ID or markAllAsRead required", "VALIDATION_ERROR", 400);
  } catch (err: any) {
    return apiError(err.message || "Failed to update notification", "DATABASE_ERROR", 500);
  }
}
