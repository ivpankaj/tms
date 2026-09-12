import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { Contact, Deal, Task, Activity } from "@/lib/db/models";

export async function POST(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req, "contacts:write");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { primaryContactId, duplicateContactId } = body;

    if (!primaryContactId || !duplicateContactId) {
      return apiError("primaryContactId and duplicateContactId are required", "VALIDATION_ERROR", 400);
    }

    if (primaryContactId === duplicateContactId) {
      return apiError("Cannot merge a contact into itself", "VALIDATION_ERROR", 400);
    }

    const [primary, duplicate] = await Promise.all([
      Contact.findOne({ _id: primaryContactId, organizationId: auth!.organizationId, isDeleted: false }),
      Contact.findOne({ _id: duplicateContactId, organizationId: auth!.organizationId, isDeleted: false }),
    ]);

    if (!primary || !duplicate) {
      return apiError("One or both contacts were not found", "NOT_FOUND", 404);
    }

    // Merge tags
    const combinedTags = Array.from(new Set([...(primary.tags || []), ...(duplicate.tags || [])]));

    // Update primary contact fields if primary is missing them
    const updates: any = {
      tags: combinedTags,
      phone: primary.phone || duplicate.phone,
      title: primary.title || duplicate.title,
      companyId: primary.companyId || duplicate.companyId,
    };

    await Contact.updateOne({ _id: primary._id }, { $set: updates });

    // Re-link deals, tasks, activities from duplicate to primary
    await Promise.all([
      Deal.updateMany({ contactId: duplicate._id }, { $set: { contactId: primary._id } }),
      Task.updateMany({ entityId: duplicate._id, entityType: "contact" }, { $set: { entityId: primary._id } }),
      Activity.updateMany({ entityId: duplicate._id, entityType: "contact" }, { $set: { entityId: primary._id } }),
      // Soft-delete duplicate contact
      Contact.updateOne({ _id: duplicate._id }, { $set: { isDeleted: true } }),
    ]);

    await Activity.create({
      organizationId: auth!.organizationId,
      type: "note",
      title: "Contact Merged",
      details: `Merged duplicate record for ${duplicate.firstName} ${duplicate.lastName} (${duplicate.email}) into this primary record`,
      entityType: "contact",
      entityId: primary._id,
      createdBy: auth!.user._id,
    });

    const updated = await Contact.findById(primary._id).populate("companyId");
    return apiSuccess(updated);
  } catch (err: any) {
    return apiError(err.message || "Failed to merge contacts", "MERGE_ERROR", 500);
  }
}
