import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { Reminder } from "@/lib/db/models";
import { processDueReminders } from "@/lib/services/reminder-scheduler";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  // Background trigger to process any due reminders immediately
  processDueReminders().catch((err) =>
    console.error("[RemindersAPI] Background processor error:", err)
  );

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // 'Pending' | 'Completed' | 'Cancelled' | 'ALL'
  const category = searchParams.get("category");
  const search = searchParams.get("search")?.trim();
  const filterSection = searchParams.get("section"); // 'today' | 'upcoming' | 'overdue' | 'completed' | 'sent'

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const baseQuery: any = {
    organizationId: auth!.organizationId,
    userId: auth!.user._id,
    isDeleted: false,
  };

  const query: any = { ...baseQuery };

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  if (category && category !== "ALL") {
    query.category = category;
  }

  if (status && status !== "ALL") {
    query.status = status;
  }

  if (filterSection === "today") {
    query.reminderTime = { $gte: startOfToday, $lte: endOfToday };
    query.status = "Pending";
  } else if (filterSection === "upcoming") {
    query.reminderTime = { $gt: now };
    query.status = "Pending";
  } else if (filterSection === "overdue") {
    query.reminderTime = { $lt: now };
    query.status = "Pending";
  } else if (filterSection === "completed") {
    query.status = "Completed";
  } else if (filterSection === "sent") {
    query.emailSent = true;
  }

  const [reminders, totalCount, pendingCount, todayCount, overdueCount, completedCount, sentCount] =
    await Promise.all([
      Reminder.find(query).sort({ reminderTime: 1 }).limit(200).lean(),
      Reminder.countDocuments(baseQuery),
      Reminder.countDocuments({ ...baseQuery, status: "Pending" }),
      Reminder.countDocuments({
        ...baseQuery,
        status: "Pending",
        reminderTime: { $gte: startOfToday, $lte: endOfToday },
      }),
      Reminder.countDocuments({
        ...baseQuery,
        status: "Pending",
        reminderTime: { $lt: now },
      }),
      Reminder.countDocuments({ ...baseQuery, status: "Completed" }),
      Reminder.countDocuments({ ...baseQuery, emailSent: true }),
    ]);

  return apiSuccess(reminders, {
    counts: {
      total: totalCount,
      pending: pendingCount,
      today: todayCount,
      overdue: overdueCount,
      completed: completedCount,
      sent: sentCount,
    },
  });
}

export async function POST(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { title, description, reminderTime, priority = "Medium", category = "Work", tags = [] } = body;

    if (!title || !title.trim()) {
      return apiError("Reminder title is required", "VALIDATION_ERROR", 400);
    }

    if (!reminderTime) {
      return apiError("Reminder date and time is required", "VALIDATION_ERROR", 400);
    }

    const scheduledDate = new Date(reminderTime);
    if (isNaN(scheduledDate.getTime())) {
      return apiError("Invalid reminder date/time format", "VALIDATION_ERROR", 400);
    }

    const reminder = await Reminder.create({
      organizationId: auth!.organizationId,
      userId: auth!.user._id,
      title: title.trim(),
      description: description?.trim() || "",
      reminderTime: scheduledDate,
      priority,
      category,
      tags: Array.isArray(tags) ? tags : [],
      status: "Pending",
      emailSent: false,
      notifiedInApp: false,
      createdBy: auth!.user._id,
    });

    // If scheduled time is due immediately or within the past, trigger delivery right away
    if (scheduledDate <= new Date()) {
      processDueReminders().catch((err) =>
        console.error("[RemindersAPI] Instant reminder process error:", err)
      );
    }

    return apiSuccess(reminder, undefined, 201);
  } catch (err: any) {
    console.error("[RemindersAPI:POST] Error creating reminder:", err);
    return apiError(err.message || "Failed to create reminder", "SERVER_ERROR", 500);
  }
}
