import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { EmailTemplate } from "@/lib/db/models";

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  const query: any = {
    organizationId: auth!.organizationId,
    isDeleted: false,
  };
  if (category) query.category = category;

  const templates = await EmailTemplate.find(query).sort({ updatedAt: -1 });
  return apiSuccess(templates);
}

export async function POST(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { name, subject, bodyHtml, variables = [], category = "Sales" } = body;

    if (!name || !subject || !bodyHtml) {
      return apiError("Name, subject, and bodyHtml are required", "VALIDATION_ERROR", 400);
    }

    const template = await EmailTemplate.create({
      organizationId: auth!.organizationId,
      name,
      subject,
      bodyHtml,
      variables,
      category,
      createdBy: auth!.user._id,
    });

    return apiSuccess(template, undefined, 201);
  } catch (err: any) {
    return apiError(err.message || "Failed to create email template", "DATABASE_ERROR", 500);
  }
}
