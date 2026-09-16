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
    .limit(30)
    .lean();

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
