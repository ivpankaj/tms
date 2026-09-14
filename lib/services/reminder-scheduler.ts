import { connectToDatabase } from "@/lib/db/connection";
import { Reminder, Notification } from "@/lib/db/models";
import { sendTaskReminderEmail } from "./email";

let isProcessing = false;

export interface ProcessRemindersResult {
  processed: number;
  sent: number;
  errors: number;
  details?: Array<{ id: string; title: string; email: string; success: boolean; error?: string }>;
}

/**
 * Scans MongoDB for any pending reminders whose scheduled reminderTime is now or in the past,
 * sends an email notification to the user via Resend, and creates an in-app notification.
 */
export async function processDueReminders(): Promise<ProcessRemindersResult> {
  if (isProcessing) {
    return { processed: 0, sent: 0, errors: 0 };
  }

  isProcessing = true;
  const result: ProcessRemindersResult = {
    processed: 0,
    sent: 0,
    errors: 0,
    details: [],
  };

  try {
    await connectToDatabase();
    const now = new Date();

    // Query pending reminders that have matured and haven't been emailed yet
    const dueReminders = await Reminder.find({
      reminderTime: { $lte: now },
      emailSent: false,
      status: "Pending",
      isDeleted: false,
    })
      .populate<{ userId: { _id: string; name: string; email: string } }>("userId", "name email")
      .limit(50);

    result.processed = dueReminders.length;

    for (const reminder of dueReminders) {
      try {
        const user = reminder.userId;
        if (!user || !user.email) {
          // Mark as skipped/handled to avoid infinite loop
          reminder.emailSent = true;
          reminder.emailSentAt = new Date();
          await reminder.save();
          continue;
        }

        const emailRes = await sendTaskReminderEmail({
          email: user.email,
          userName: user.name,
          taskTitle: reminder.title,
          description: reminder.description,
          reminderTime: reminder.reminderTime,
          priority: reminder.priority,
          category: reminder.category,
        });

        if (emailRes.success) {
          reminder.emailSent = true;
          reminder.emailSentAt = new Date();
          reminder.notifiedInApp = true;
          await reminder.save();

          // Create in-app notification
          try {
            await Notification.create({
              organizationId: reminder.organizationId,
              userId: user._id,
              title: `Task Reminder: ${reminder.title}`,
              message: reminder.description || `Your reminder for "${reminder.title}" is due now.`,
              type: "task",
              link: "/reminders",
              isRead: false,
            });
          } catch (notifErr) {
            console.error("[ReminderScheduler] Failed to create in-app notification:", notifErr);
          }

          result.sent++;
          result.details?.push({
            id: reminder._id.toString(),
            title: reminder.title,
            email: user.email,
            success: true,
          });
        } else {
          result.errors++;
          result.details?.push({
            id: reminder._id.toString(),
            title: reminder.title,
            email: user.email,
            success: false,
            error: emailRes.error,
          });
        }
      } catch (err: any) {
        result.errors++;
        console.error(`[ReminderScheduler] Error processing reminder ${reminder._id}:`, err);
      }
    }
  } catch (err) {
    console.error("[ReminderScheduler] Fatal error scanning reminders:", err);
  } finally {
    isProcessing = false;
  }

  return result;
}
