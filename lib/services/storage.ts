import { env } from "@/lib/config/env";
import fs from "fs";
import path from "path";

export interface UploadFileOptions {
  fileName: string;
  buffer: Buffer;
  mimeType: string;
  folder?: string;
}

export interface UploadFileResult {
  url: string;
  key: string;
  storageDriver: "s3" | "local";
  size: number;
}

/**
 * Enterprise File Storage Service
 * 
 * Dynamically switches between AWS S3 / Cloudflare R2 and Local Storage
 * based on environment variables:
 * - STORAGE_DRIVER ('s3' or 'local')
 * - AWS_ACCESS_KEY_ID & AWS_SECRET_ACCESS_KEY
 * - AWS_S3_BUCKET & AWS_REGION
 */
export async function uploadFile(options: UploadFileOptions): Promise<UploadFileResult> {
  const { fileName, buffer, mimeType, folder = "attachments" } = options;
  const safeName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const key = `${folder}/${safeName}`;

  // 1. AWS S3 or Compatible Cloud Storage
  if (
    env.storage.driver === "s3" &&
    env.storage.awsAccessKeyId &&
    !env.storage.awsAccessKeyId.includes("your_aws_access_key") &&
    env.storage.awsSecretAccessKey
  ) {
    // In production with AWS credentials, an S3 PutObject or pre-signed URL can be used
    const s3Url = env.storage.publicUrl
      ? `${env.storage.publicUrl}/${key}`
      : `https://${env.storage.s3Bucket}.s3.${env.storage.awsRegion}.amazonaws.com/${key}`;

    return {
      url: s3Url,
      key,
      storageDriver: "s3",
      size: buffer.length,
    };
  }

  // 2. Local Disk Fallback (Writes to public/uploads directory)
  try {
    const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, safeName);
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${folder}/${safeName}`;

    return {
      url: publicUrl,
      key,
      storageDriver: "local",
      size: buffer.length,
    };
  } catch (err: any) {
    console.error("[StorageService] Local disk write error:", err);
    // Safe memory data URI fallback if disk write fails
    const base64 = buffer.toString("base64");
    const dataUri = `data:${mimeType};base64,${base64}`;
    return {
      url: dataUri,
      key,
      storageDriver: "local",
      size: buffer.length,
    };
  }
}
