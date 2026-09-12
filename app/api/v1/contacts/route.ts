import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError, parsePagination } from "@/lib/auth/api-auth";
import { Contact, Company, Activity } from "@/lib/db/models";

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req, "contacts:read");
  if (errorResponse) return errorResponse;

  const { page, limit, skip, search, sortOptions } = parsePagination(req);
  const { searchParams } = new URL(req.url);
  const tag = searchParams.get("tag");
  const stage = searchParams.get("stage");
  const companyId = searchParams.get("companyId");

  const query: any = {
    organizationId: auth!.organizationId,
    isDeleted: false,
  };

  if (tag) query.tags = tag;
  if (stage) query.lifecycleStage = stage;
  if (companyId) query.companyId = companyId;

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { title: { $regex: search, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    Contact.find(query)
      .populate("companyId", "name domain industry")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit),
    Contact.countDocuments(query),
  ]);

  return apiSuccess(items, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req, "contacts:write");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { firstName, lastName, email, phone, title, companyId, tags, socialLinks, customFields, leadSource, lifecycleStage } = body;

    if (!firstName || !lastName || !email) {
      return apiError("First name, last name, and email are required", "VALIDATION_ERROR", 400);
    }

    const contact = await Contact.create({
      organizationId: auth!.organizationId,
      firstName,
      lastName,
      email: email.toLowerCase().trim(),
      phone,
      title,
      companyId: companyId || undefined,
      tags: tags || [],
      socialLinks: socialLinks || {},
      customFields: customFields || {},
      leadSource: leadSource || "Manual Entry",
      lifecycleStage: lifecycleStage || "Lead",
      createdBy: auth!.user._id,
    });

    // Log Activity
    await Activity.create({
      organizationId: auth!.organizationId,
      type: "note",
      title: "Contact Created",
      details: `Created new contact: ${firstName} ${lastName} (${email})`,
      entityType: "contact",
      entityId: contact._id,
      createdBy: auth!.user._id,
    });

    const populated = await Contact.findById(contact._id).populate("companyId", "name domain");
    return apiSuccess(populated, undefined, 201);
  } catch (err: any) {
    return apiError(err.message || "Failed to create contact", "DATABASE_ERROR", 500);
  }
}
