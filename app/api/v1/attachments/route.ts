import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { Attachment } from "@/lib/db/models";
import { uploadFile } from "@/lib/services/storage";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");

    const query: any = {
      organizationId: auth!.organizationId,
      isDeleted: false,
    };

    if (entityType) query.entityType = entityType;
    if (entityId && mongoose.isValidObjectId(entityId)) {
      query.entityId = new mongoose.Types.ObjectId(entityId);
    }

    const attachments = await Attachment.find(query).sort({ createdAt: -1 });

    return apiSuccess({ attachments });
  } catch (err: any) {
    return apiError(err.message || "Failed to fetch attachments", "DATABASE_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const entityType = (formData.get("entityType") as string) || "deal";
    const entityId = (formData.get("entityId") as string) || auth!.user._id;

    if (!file) {
      return apiError("No file provided in upload request", "VALIDATION_ERROR", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await uploadFile({
      fileName: file.name,
      buffer,
      mimeType: file.type || "application/octet-stream",
      folder: entityType,
    });

    const attachment = await Attachment.create({
      organizationId: auth!.organizationId,
      name: file.name,
      url: uploadResult.url,
      size: uploadResult.size,
      mimeType: file.type || "application/octet-stream",
      entityType: (["contact", "deal", "company", "lead", "ticket"].includes(entityType)
        ? entityType
        : "deal") as "contact" | "deal" | "company" | "lead" | "ticket",
      entityId: mongoose.isValidObjectId(entityId)
        ? new mongoose.Types.ObjectId(entityId)
        : auth!.user._id,
      createdBy: auth!.user._id,
    });

    return apiSuccess(
      {
        attachment,
        storageDriver: uploadResult.storageDriver,
      },
      undefined,
      201
    );
  } catch (err: any) {
    return apiError(err.message || "File upload failed", "UPLOAD_ERROR", 500);
  }
}
