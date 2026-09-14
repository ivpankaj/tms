import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { Reminder } from "@/lib/db/models";
import { processDueReminders } from "@/lib/services/reminder-scheduler";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  const { id } = await params;

  try {
    const body = await req.json();
    const reminder = await Reminder.findOne({
      _id: id,
      organizationId: auth!.organizationId,
      userId: auth!.user._id,
      isDeleted: false,
    });

    if (!reminder) {
      return apiError("Reminder not found", "NOT_FOUND", 404);
    }

    // Handle Quick Snooze action
    if (body.snoozeMinutes && typeof body.snoozeMinutes === "number") {
      const newTime = new Date(Date.now() + body.snoozeMinutes * 60 * 1000);
      reminder.reminderTime = newTime;
      reminder.emailSent = false;
      reminder.status = "Pending";
      await reminder.save();
      return apiSuccess(reminder);
    }

    if (body.title !== undefined) reminder.title = body.title.trim();
    if (body.description !== undefined) reminder.description = body.description.trim();
    if (body.priority !== undefined) reminder.priority = body.priority;
    if (body.category !== undefined) reminder.category = body.category;
    if (body.status !== undefined) reminder.status = body.status;

    if (body.reminderTime) {
      const scheduled = new Date(body.reminderTime);
      if (!isNaN(scheduled.getTime())) {
        reminder.reminderTime = scheduled;
        // If scheduled into future, allow email to trigger again
        if (scheduled > new Date()) {
          reminder.emailSent = false;
        }
      }
    }

    await reminder.save();

    // If rescheduled to now/past, process immediately
    if (reminder.status === "Pending" && !reminder.emailSent && reminder.reminderTime <= new Date()) {
      processDueReminders().catch((err) =>
        console.error("[RemindersAPI] Snooze trigger error:", err)
      );
    }

    return apiSuccess(reminder);
  } catch (err: any) {
    console.error("[RemindersAPI:PATCH] Error updating reminder:", err);
    return apiError(err.message || "Failed to update reminder", "SERVER_ERROR", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  const { id } = await params;

  try {
    const reminder = await Reminder.findOneAndUpdate(
      {
        _id: id,
        organizationId: auth!.organizationId,
        userId: auth!.user._id,
        isDeleted: false,
      },
      { isDeleted: true },
      { new: true }
    );

    if (!reminder) {
      return apiError("Reminder not found", "NOT_FOUND", 404);
    }

    return apiSuccess({ message: "Reminder removed successfully" });
  } catch (err: any) {
    console.error("[RemindersAPI:DELETE] Error deleting reminder:", err);
    return apiError(err.message || "Failed to delete reminder", "SERVER_ERROR", 500);
  }
}
