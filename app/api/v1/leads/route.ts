import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError, parsePagination } from "@/lib/auth/api-auth";
import { Lead } from "@/lib/db/models";
import { calculateLeadScore } from "@/lib/utils/lead-scorer";

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req, "leads:read");
  if (errorResponse) return errorResponse;

  const { page, limit, skip, search, sortOptions } = parsePagination(req);
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const source = searchParams.get("source");

  const query: any = {
    organizationId: auth!.organizationId,
    isDeleted: false,
  };

  if (status) query.status = status;
  if (source) query.source = source;

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { company: { $regex: search, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    Lead.find(query)
      .populate("assignedTo", "name email")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit),
    Lead.countDocuments(query),
  ]);

  return apiSuccess(items, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req, "leads:write");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { firstName, lastName, email, phone, company, title, source, assignedTo, customFields } = body;

    if (!firstName || !lastName || !email) {
      return apiError("First name, last name, and email are required", "VALIDATION_ERROR", 400);
    }

    const calculatedScore = calculateLeadScore({ title, company, source, email, phone });

    const lead = await Lead.create({
      organizationId: auth!.organizationId,
      firstName,
      lastName,
      email: email.toLowerCase().trim(),
      phone,
      company,
      title,
      source: source || "Manual Entry",
      score: calculatedScore,
      status: "New",
      assignedTo: assignedTo || auth!.user._id,
      customFields: customFields || {},
      createdBy: auth!.user._id,
    });

    const populated = await Lead.findById(lead._id).populate("assignedTo", "name email");
    return apiSuccess(populated, undefined, 201);
  } catch (err: any) {
    return apiError(err.message || "Failed to create lead", "DATABASE_ERROR", 500);
  }
}
