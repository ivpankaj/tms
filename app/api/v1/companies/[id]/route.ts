import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { Company, Contact, Deal, Task } from "@/lib/db/models";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { auth, errorResponse } = await authenticateRequest(req, "contacts:read");
  if (errorResponse) return errorResponse;

  const company = await Company.findOne({
    _id: id,
    organizationId: auth!.organizationId,
    isDeleted: false,
  }).populate("parentCompanyId");

  if (!company) {
    return apiError("Company not found", "NOT_FOUND", 404);
  }

  // Child companies, contacts, deals, tasks
  const [children, contacts, deals, tasks] = await Promise.all([
    Company.find({ parentCompanyId: id, organizationId: auth!.organizationId, isDeleted: false }),
    Contact.find({ companyId: id, organizationId: auth!.organizationId, isDeleted: false }),
    Deal.find({ companyId: id, organizationId: auth!.organizationId, isDeleted: false }).populate("stageId"),
    Task.find({ entityId: id, organizationId: auth!.organizationId, isDeleted: false }),
  ]);

  return apiSuccess({
    company,
    childCompanies: children,
    contacts,
    deals,
    tasks,
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
    const company = await Company.findOneAndUpdate(
      { _id: id, organizationId: auth!.organizationId, isDeleted: false },
      { $set: body },
      { new: true }
    );

    if (!company) {
      return apiError("Company not found", "NOT_FOUND", 404);
    }

    return apiSuccess(company);
  } catch (err: any) {
    return apiError(err.message || "Failed to update company", "DATABASE_ERROR", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { auth, errorResponse } = await authenticateRequest(req, "contacts:delete");
  if (errorResponse) return errorResponse;

  const company = await Company.findOneAndUpdate(
    { _id: id, organizationId: auth!.organizationId, isDeleted: false },
    { $set: { isDeleted: true } }
  );

  if (!company) {
    return apiError("Company not found", "NOT_FOUND", 404);
  }

  return apiSuccess({ deleted: true, id });
}
