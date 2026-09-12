import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { Tag } from "@/lib/db/models";

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const entityType = searchParams.get("entityType");

  const query: any = {
    organizationId: auth!.organizationId,
    isDeleted: false,
  };
  if (entityType) query.entityType = entityType;

  const tags = await Tag.find(query).sort({ name: 1 });
  return apiSuccess(tags);
}

export async function POST(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { name, color = "#3b82f6", entityType = "contact" } = body;

    if (!name) {
      return apiError("Tag name is required", "VALIDATION_ERROR", 400);
    }

    const existing = await Tag.findOne({
      organizationId: auth!.organizationId,
      name: name.trim(),
      entityType,
      isDeleted: false,
    });

    if (existing) {
      return apiSuccess(existing);
    }

    const tag = await Tag.create({
      organizationId: auth!.organizationId,
      name: name.trim(),
      color,
      entityType,
    });

    return apiSuccess(tag, undefined, 201);
  } catch (err: any) {
    return apiError(err.message || "Failed to create tag", "DATABASE_ERROR", 500);
  }
}

export async function DELETE(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return apiError("Tag ID is required", "VALIDATION_ERROR", 400);
  }

  await Tag.findOneAndUpdate(
    { _id: id, organizationId: auth!.organizationId },
    { $set: { isDeleted: true } }
  );

  return apiSuccess({ deleted: true, id });
}
