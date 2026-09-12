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
  const ticket = await Ticket.findOne({
    _id: id,
    organizationId: auth!.organizationId,
    isDeleted: false,
  })
    .populate("contactId", "firstName lastName email phone")
    .populate("companyId", "name domain")
    .populate("assignedTo", "name email avatar");

  if (!ticket) {
    return apiError("Ticket not found", "NOT_FOUND", 404);
  }

  const comments = await TicketComment.find({
    ticketId: id,
    isDeleted: false,
  })
    .populate("createdBy", "name email avatar")
    .sort({ createdAt: 1 });

  return apiSuccess({
    ...ticket.toObject(),
    comments,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, errorResponse } = await authenticateRequest(req, "tickets:write");
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const body = await req.json();

    const ticket = await Ticket.findOne({
      _id: id,
      organizationId: auth!.organizationId,
      isDeleted: false,
    });

    if (!ticket) {
      return apiError("Ticket not found", "NOT_FOUND", 404);
    }

    const updates: any = {};
    const allowed = ["subject", "description", "status", "priority", "assignedTo", "slaDueDate"];
    for (const key of allowed) {
      if (body[key] !== undefined) {
        updates[key] = key === "slaDueDate" && body[key] ? new Date(body[key]) : body[key];
      }
    }

    const updated = await Ticket.findOneAndUpdate(
      { _id: id, organizationId: auth!.organizationId },
      { $set: updates },
      { new: true }
    )
      .populate("contactId", "firstName lastName email")
      .populate("companyId", "name domain")
      .populate("assignedTo", "name email avatar");

    if (body.status && body.status !== ticket.status) {
      await Activity.create({
        organizationId: auth!.organizationId,
        type: "status_change",
        title: `Ticket Status: ${body.status}`,
        details: `Ticket #${ticket.ticketNumber} marked as ${body.status}`,
        entityType: "ticket",
        entityId: ticket._id,
        createdBy: auth!.user._id,
      });
    }

    return apiSuccess(updated);
  } catch (err: any) {
    return apiError(err.message || "Failed to update ticket", "DATABASE_ERROR", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, errorResponse } = await authenticateRequest(req, "tickets:write");
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const ticket = await Ticket.findOneAndUpdate(
    { _id: id, organizationId: auth!.organizationId, isDeleted: false },
    { $set: { isDeleted: true } },
    { new: true }
  );

  if (!ticket) {
    return apiError("Ticket not found", "NOT_FOUND", 404);
  }

  return apiSuccess({ deleted: true, id });
}
