import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { Reminder } from "@/lib/db/models";
import { processDueReminders } from "@/lib/services/reminder-scheduler";

export const dynamic = "force-dynamic";
export const revalidate = 0;

let lastBackgroundRun = 0;

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  // Background trigger to process any due reminders throttled to once per minute
  const nowMs = Date.now();
  if (nowMs - lastBackgroundRun > 60000) {
    lastBackgroundRun = nowMs;
    processDueReminders().catch((err) =>
      console.error("[RemindersAPI] Background processor error:", err)
    );
  }

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

  const [reminders, countsAgg] = await Promise.all([
    Reminder.find(query).sort({ reminderTime: 1 }).limit(200).lean(),
    Reminder.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          today: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "Pending"] },
                    { $gte: ["$reminderTime", startOfToday] },
                    { $lte: ["$reminderTime", endOfToday] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "Pending"] },
                    { $lt: ["$reminderTime", now] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          completed: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          sent: { $sum: { $cond: [{ $eq: ["$emailSent", true] }, 1, 0] } },
        },
      },
    ]),
  ]);

  const stats = countsAgg[0] || {
    total: 0,
    pending: 0,
    today: 0,
    overdue: 0,
    completed: 0,
    sent: 0,
  };

  return apiSuccess(reminders, {
    counts: {
      total: stats.total || 0,
      pending: stats.pending || 0,
      today: stats.today || 0,
      overdue: stats.overdue || 0,
      completed: stats.completed || 0,
      sent: stats.sent || 0,
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
