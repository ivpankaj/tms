import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { CustomFieldDefinition } from "@/lib/db/models";

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req, "settings:read");
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const entityType = searchParams.get("entityType");

  const query: any = {
    organizationId: auth!.organizationId,
    isDeleted: false,
  };
  if (entityType) query.entityType = entityType;

  const fields = await CustomFieldDefinition.find(query).sort({ createdAt: 1 });
  return apiSuccess(fields);
}

export async function POST(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req, "settings:write");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { entityType, name, key, fieldType = "text", options = [], isRequired = false } = body;

    if (!entityType || !name || !key) {
      return apiError("entityType, name, and key are required", "VALIDATION_ERROR", 400);
    }

    const fieldKey = key.toLowerCase().replace(/[^a-z0-9_]/g, "_");

    const existing = await CustomFieldDefinition.findOne({
      organizationId: auth!.organizationId,
      entityType,
      key: fieldKey,
      isDeleted: false,
    });

    if (existing) {
      return apiError("A custom field with this key already exists for this entity", "ALREADY_EXISTS", 400);
    }

    const fieldDef = await CustomFieldDefinition.create({
      organizationId: auth!.organizationId,
      entityType,
      name,
      key: fieldKey,
      fieldType,
      options,
      isRequired,
      createdBy: auth!.user._id,
    });

    return apiSuccess(fieldDef, undefined, 201);
  } catch (err: any) {
    return apiError(err.message || "Failed to create custom field", "DATABASE_ERROR", 500);
  }
}

export async function DELETE(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req, "settings:write");
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return apiError("Field ID is required", "VALIDATION_ERROR", 400);
  }

  await CustomFieldDefinition.findOneAndUpdate(
    { _id: id, organizationId: auth!.organizationId },
    { $set: { isDeleted: true } }
  );

  return apiSuccess({ deleted: true, id });
}
