import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError, parsePagination } from "@/lib/auth/api-auth";
import { Company, Contact, Deal } from "@/lib/db/models";

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req, "contacts:read");
  if (errorResponse) return errorResponse;

  const { page, limit, skip, search, sortOptions } = parsePagination(req);
  const { searchParams } = new URL(req.url);
  const industry = searchParams.get("industry");

  const query: any = {
    organizationId: auth!.organizationId,
    isDeleted: false,
  };

  if (industry) query.industry = industry;

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { domain: { $regex: search, $options: "i" } },
      { industry: { $regex: search, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    Company.find(query)
      .populate("parentCompanyId", "name")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit),
    Company.countDocuments(query),
  ]);

  // Augment with contact and deal counts
  const enriched = await Promise.all(
    items.map(async (company) => {
      const [contactCount, dealCount] = await Promise.all([
        Contact.countDocuments({ companyId: company._id, isDeleted: false }),
        Deal.countDocuments({ companyId: company._id, isDeleted: false }),
      ]);
      return {
        ...company.toObject(),
        contactCount,
        dealCount,
      };
    })
  );

  return apiSuccess(enriched, {
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
    const { name, domain, industry, size, phone, address, parentCompanyId, customFields } = body;

    if (!name) {
      return apiError("Company name is required", "VALIDATION_ERROR", 400);
    }

    const company = await Company.create({
      organizationId: auth!.organizationId,
      name,
      domain,
      industry,
      size,
      phone,
      address: address || {},
      parentCompanyId: parentCompanyId || undefined,
      customFields: customFields || {},
      createdBy: auth!.user._id,
    });

    return apiSuccess(company, undefined, 201);
  } catch (err: any) {
    return apiError(err.message || "Failed to create company", "DATABASE_ERROR", 500);
  }
}
