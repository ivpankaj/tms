import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { Contact, Activity, Deal, Task } from "@/lib/db/models";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { auth, errorResponse } = await authenticateRequest(req, "contacts:read");
  if (errorResponse) return errorResponse;

  const contact = await Contact.findOne({
    _id: id,
    organizationId: auth!.organizationId,
    isDeleted: false,
  }).populate("companyId");

  if (!contact) {
    return apiError("Contact not found", "NOT_FOUND", 404);
  }

  // Also fetch related deals, tasks, and activities
  const [deals, tasks, activities] = await Promise.all([
    Deal.find({ contactId: id, organizationId: auth!.organizationId, isDeleted: false }).populate("stageId"),
    Task.find({ entityId: id, organizationId: auth!.organizationId, isDeleted: false }),
    Activity.find({ entityId: id, organizationId: auth!.organizationId, isDeleted: false }).sort({ createdAt: -1 }),
  ]);

  return apiSuccess({
    contact,
    deals,
    tasks,
    activities,
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { auth, errorResponse } = await authenticateRequest(req, "contacts:write");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const contact = await Contact.findOneAndUpdate(
      { _id: id, organizationId: auth!.organizationId, isDeleted: false },
      { $set: body },
      { new: true }
    ).populate("companyId");

    if (!contact) {
      return apiError("Contact not found", "NOT_FOUND", 404);
    }

    await Activity.create({
      organizationId: auth!.organizationId,
      type: "note",
      title: "Contact Updated",
      details: `Updated details for ${contact.firstName} ${contact.lastName}`,
      entityType: "contact",
      entityId: contact._id,
      createdBy: auth!.user._id,
    });

    return apiSuccess(contact);
  } catch (err: any) {
    return apiError(err.message || "Failed to update contact", "DATABASE_ERROR", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { auth, errorResponse } = await authenticateRequest(req, "contacts:delete");
  if (errorResponse) return errorResponse;

  const contact = await Contact.findOneAndUpdate(
    { _id: id, organizationId: auth!.organizationId, isDeleted: false },
    { $set: { isDeleted: true } }
  );

  if (!contact) {
    return apiError("Contact not found", "NOT_FOUND", 404);
  }

  return apiSuccess({ deleted: true, id });
}
