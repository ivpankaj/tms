import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { processDueReminders } from "@/lib/services/reminder-scheduler";

export async function POST(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  try {
    const result = await processDueReminders();
    return apiSuccess(result);
  } catch (err: any) {
    console.error("[RemindersProcessAPI] Execution error:", err);
    return apiError(err.message || "Failed to process due reminders", "SERVER_ERROR", 500);
  }
}
