import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError, parsePagination } from "@/lib/auth/api-auth";
import { Ticket, Activity } from "@/lib/db/models";

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req, "tickets:read");
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const assignedTo = searchParams.get("assignedTo");
  const contactId = searchParams.get("contactId");
  const companyId = searchParams.get("companyId");
  const { page, limit, skip, search, sortOptions } = parsePagination(req);

  const query: any = {
    organizationId: auth!.organizationId,
    isDeleted: false,
  };

  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (assignedTo) query.assignedTo = assignedTo;
  if (contactId) query.contactId = contactId;
  if (companyId) query.companyId = companyId;

  if (search) {
    query.$or = [
      { ticketNumber: { $regex: search, $options: "i" } },
      { subject: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const [tickets, total] = await Promise.all([
    Ticket.find(query)
      .populate("contactId", "firstName lastName email")
      .populate("companyId", "name domain")
      .populate("assignedTo", "name email avatar")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit),
    Ticket.countDocuments(query),
  ]);

  return apiSuccess(tickets, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req, "tickets:write");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const {
      subject,
      description,
      status = "Open",
      priority = "Medium",
      contactId,
      companyId,
      assignedTo,
      slaDueDate,
    } = body;

    if (!subject) {
      return apiError("Ticket subject is required", "VALIDATION_ERROR", 400);
    }

    const count = await Ticket.countDocuments({ organizationId: auth!.organizationId });
    const ticketNumber = `TICK-${1000 + count + 1}`;

    const ticket = await Ticket.create({
      organizationId: auth!.organizationId,
      ticketNumber,
      subject,
      description,
      status,
      priority,
      contactId: contactId || undefined,
      companyId: companyId || undefined,
      assignedTo: assignedTo || auth!.user._id,
      slaDueDate: slaDueDate ? new Date(slaDueDate) : new Date(Date.now() + 48 * 3600 * 1000), // default 48h SLA
      createdBy: auth!.user._id,
    });

    // Log activity
    if (contactId) {
      await Activity.create({
        organizationId: auth!.organizationId,
        type: "note",
        title: "Support Ticket Opened",
        details: `Ticket ${ticketNumber}: "${subject}"`,
        entityType: "contact",
        entityId: contactId,
        createdBy: auth!.user._id,
      });
    }

    const populated = await Ticket.findById(ticket._id)
      .populate("contactId", "firstName lastName email")
      .populate("companyId", "name domain")
      .populate("assignedTo", "name email avatar");

    return apiSuccess(populated, undefined, 201);
  } catch (err: any) {
    return apiError(err.message || "Failed to create ticket", "DATABASE_ERROR", 500);
  }
}
