import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { Ticket, TicketComment, Activity } from "@/lib/db/models";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, errorResponse } = await authenticateRequest(req, "tickets:read");
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const comments = await TicketComment.find({
    ticketId: id,
    isDeleted: false,
  })
    .populate("createdBy", "name email avatar")
    .sort({ createdAt: 1 });

  return apiSuccess(comments);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, errorResponse } = await authenticateRequest(req, "tickets:write");
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const body = await req.json();
    const { body: commentText, isInternal = false, attachments = [] } = body;

    if (!commentText) {
      return apiError("Comment body is required", "VALIDATION_ERROR", 400);
    }

    const ticket = await Ticket.findOne({
      _id: id,
      organizationId: auth!.organizationId,
      isDeleted: false,
    });

    if (!ticket) {
      return apiError("Ticket not found", "NOT_FOUND", 404);
    }

    const comment = await TicketComment.create({
      ticketId: id,
      body: commentText,
      isInternal,
      attachments,
      createdBy: auth!.user._id,
    });

    await Activity.create({
      organizationId: auth!.organizationId,
      type: "note",
      title: isInternal ? "Internal Note Added" : "Ticket Reply Sent",
      details: commentText.substring(0, 120),
      entityType: "ticket",
      entityId: id,
      createdBy: auth!.user._id,
    });

    const populated = await TicketComment.findById(comment._id).populate(
      "createdBy",
      "name email avatar"
    );

    return apiSuccess(populated, undefined, 201);
  } catch (err: any) {
    return apiError(err.message || "Failed to add comment", "DATABASE_ERROR", 500);
  }
}
