import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { uploadFile } from "@/lib/services/storage";
import { isCloudinaryActive } from "@/lib/services/cloudinary";

export async function POST(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "media";
    const resourceType = (formData.get("resourceType") as "image" | "video" | "raw" | "auto") || "auto";

    if (!file) {
      return apiError("No file provided in upload request", "VALIDATION_ERROR", 400);
    }

    // Limit maximum file size (50MB for video/media, 10MB for general files)
    const maxSizeBytes = 50 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return apiError("File size exceeds 50MB limit", "FILE_TOO_LARGE", 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadFile({
      fileName: file.name,
      buffer,
      mimeType: file.type || "application/octet-stream",
      folder,
      resourceType,
    });

    return apiSuccess({
      url: result.url,
      key: result.key,
      size: result.size,
      name: file.name,
      type: file.type,
      storageDriver: result.storageDriver,
      isCloudinary: result.storageDriver === "cloudinary",
      cloudinaryConfigured: isCloudinaryActive(),
      message:
        result.storageDriver === "cloudinary"
          ? "Uploaded successfully to Cloudinary Cloud"
          : isCloudinaryActive()
          ? "Uploaded via local storage fallback"
          : "Uploaded locally (Set CLOUDINARY_* in .env to upload to Cloudinary)",
    });
  } catch (err: any) {
    console.error("[UploadRoute] Error:", err);
    return apiError(err.message || "Failed to process media upload", "UPLOAD_ERROR", 500);
  }
}
