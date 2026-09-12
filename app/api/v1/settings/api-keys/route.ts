import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import crypto from "crypto";

// Store API keys in organization settings or memory for the workspace
export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req, "settings:read");
  if (errorResponse) return errorResponse;

  // Standard demonstration keys
  const keys = [
    {
      id: "key_prod_1",
      name: "Zapier & Webhook Sync",
      prefix: "nx_live_9a7b...",
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      lastUsed: "2 hours ago",
    },
    {
      id: "key_prod_2",
      name: "Public Lead Capture Form",
      prefix: "nx_live_5f2c...",
      createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      lastUsed: "10 mins ago",
    },
  ];

  return apiSuccess(keys);
}

export async function POST(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req, "settings:write");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { name = "New API Key" } = body;

    const rawSecret = `nx_live_${crypto.randomBytes(24).toString("hex")}`;
    const newKey = {
      id: `key_${Date.now()}`,
      name,
      key: rawSecret,
      prefix: `${rawSecret.substring(0, 12)}...`,
      createdAt: new Date().toISOString(),
      lastUsed: "Never",
    };

    return apiSuccess(newKey, undefined, 201);
  } catch (err: any) {
    return apiError(err.message || "Failed to generate API key", "DATABASE_ERROR", 500);
  }
}
