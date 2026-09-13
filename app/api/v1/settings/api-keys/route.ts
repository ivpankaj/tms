import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { ApiKey, AuditLog } from "@/lib/db/models";
import { isDefaultPlatformAdmin } from "@/lib/config/env";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req, "settings:read");
  if (errorResponse) return errorResponse;

  // Only the default platform administrator can view and manage API keys
  if (!isDefaultPlatformAdmin(auth!.user.email)) {
    return apiError("Access restricted to platform administrator", "FORBIDDEN", 403);
  }

  try {
    const keys = await ApiKey.find({
      organizationId: auth!.organizationId,
      isDeleted: false,
    }).sort({ createdAt: -1 });

    const formatted = keys.map((k) => ({
      id: k._id.toString(),
      name: k.name,
      prefix: k.prefix,
      createdAt: k.createdAt.toISOString(),
      lastUsed: k.lastUsedAt ? k.lastUsedAt.toLocaleString() : "Never",
    }));

    return apiSuccess(formatted);
  } catch (err: any) {
    return apiError(err.message || "Failed to fetch API keys", "DATABASE_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req, "settings:write");
  if (errorResponse) return errorResponse;

  // Only the default platform administrator can generate API keys
  if (!isDefaultPlatformAdmin(auth!.user.email)) {
    return apiError("Access restricted to platform administrator", "FORBIDDEN", 403);
  }

  try {
    const body = await req.json();
    const { name = "New API Key" } = body;

    const rawSecret = `nx_live_${crypto.randomBytes(24).toString("hex")}`;
    const prefix = `${rawSecret.substring(0, 12)}...`;
    const hashedKey = crypto.createHash("sha256").update(rawSecret).digest("hex");

    const created = await ApiKey.create({
      organizationId: auth!.organizationId,
      name: name.trim(),
      prefix,
      hashedKey,
      createdBy: auth!.user._id,
      isDeleted: false,
    });

    await AuditLog.create({
      organizationId: auth!.organizationId,
      userId: auth!.user._id,
      action: "CREATE_API_KEY",
      entityType: "api_key",
      entityId: created._id,
      changes: { name: created.name, prefix },
    });

    const responseData = {
      id: created._id.toString(),
      name: created.name,
      key: rawSecret, // Sent ONLY once upon creation
      prefix: created.prefix,
      createdAt: created.createdAt.toISOString(),
      lastUsed: "Never",
    };

    return apiSuccess(responseData, undefined, 201);
  } catch (err: any) {
    return apiError(err.message || "Failed to generate API key", "DATABASE_ERROR", 500);
  }
}
