import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { env } from "@/lib/config/env";

// Configure Cloudinary SDK instance
if (env.cloudinary.isConfigured) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
}

export interface CloudinaryUploadOptions {
  buffer: Buffer;
  fileName: string;
  folder?: string;
  mimeType?: string;
  resourceType?: "image" | "video" | "raw" | "auto";
}

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  resourceType: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  duration?: number;
}

/**
 * Uploads media buffer directly to Cloudinary
 */
export async function uploadToCloudinary(
  options: CloudinaryUploadOptions
): Promise<CloudinaryUploadResult> {
  const { buffer, fileName, folder = "cookmywork", mimeType, resourceType = "auto" } = options;

  if (!env.cloudinary.isConfigured) {
    throw new Error(
      "Cloudinary is not configured. Please provide CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file."
    );
  }

  // Re-verify configuration in case environment updated at runtime
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });

  const baseName = fileName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_");
  const publicId = `${folder}/${Date.now()}_${baseName}`;

  // Automatically detect resource type if auto was provided
  let detectedType: "image" | "video" | "raw" | "auto" = resourceType;
  if (mimeType) {
    if (mimeType.startsWith("image/")) detectedType = "image";
    else if (mimeType.startsWith("video/") || mimeType.startsWith("audio/")) detectedType = "video";
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: detectedType,
        overwrite: true,
      },
      (error, result: UploadApiResponse | undefined) => {
        if (error || !result) {
          return reject(error || new Error("Failed to upload to Cloudinary"));
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
          format: result.format,
          bytes: result.bytes,
          width: result.width,
          height: result.height,
          duration: result.duration,
        });
      }
    );

    uploadStream.end(buffer);
  });
}

export function isCloudinaryActive(): boolean {
  return env.cloudinary.isConfigured;
}
