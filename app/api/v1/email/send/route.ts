import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { Activity, Contact } from "@/lib/db/models";
import { sendEmail } from "@/lib/services/email";

export async function POST(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { to, subject, bodyHtml, entityType, entityId, contactId } = body;

    if (!to || !subject || !bodyHtml) {
      return apiError("Recipient 'to', 'subject', and 'bodyHtml' are required", "VALIDATION_ERROR", 400);
    }

    // Interpolate variables if contact context exists
    let processedHtml = bodyHtml;
    let processedSubject = subject;

    if (contactId || (entityType === "contact" && entityId)) {
      const targetContact = await Contact.findById(contactId || entityId);
      if (targetContact) {
        processedHtml = processedHtml
          .replace(/\{\{first_name\}\}/g, targetContact.firstName || "")
          .replace(/\{\{last_name\}\}/g, targetContact.lastName || "")
          .replace(/\{\{email\}\}/g, targetContact.email || "");
        processedSubject = processedSubject
          .replace(/\{\{first_name\}\}/g, targetContact.firstName || "")
          .replace(/\{\{last_name\}\}/g, targetContact.lastName || "");
      }
    }

    // Dispatch email using environment configured provider (Resend / SMTP / mock)
    const emailResult = await sendEmail({
      to,
      subject: processedSubject,
      html: processedHtml,
    });

    const messageId = emailResult.messageId || `msg_${Date.now()}`;

    // Log Activity
    const activity = await Activity.create({
      organizationId: auth!.organizationId,
      type: "email",
      title: `Email Sent: ${processedSubject}`,
      details: `To: ${to}\nMessage: ${processedHtml.replace(/<[^>]*>?/gm, "")}`,
      entityType: entityType || "contact",
      entityId: entityId || contactId || auth!.user._id,
      metadata: {
        messageId,
        to,
        subject: processedSubject,
        status: emailResult.success ? "delivered" : "failed",
        provider: emailResult.provider,
        opened: false,
        clicked: false,
      },
      createdBy: auth!.user._id,
    });

    return apiSuccess({
      messageId,
      status: emailResult.success ? "delivered" : "failed",
      provider: emailResult.provider,
      activity,
      sentAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return apiError(err.message || "Failed to send email", "EMAIL_ERROR", 500);
  }
}
