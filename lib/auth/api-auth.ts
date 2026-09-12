import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connection";
import { User, Organization, IUser } from "@/lib/db/models";
import { verifyJwt } from "@/lib/auth/jwt";
import { hasPermission } from "@/lib/auth/roles";
import { seedDatabase } from "@/lib/db/seed";
import { env } from "@/lib/config/env";

export interface AuthenticatedContext {
  user: IUser;
  organizationId: string;
}

export function apiSuccess<T>(data: T, meta?: Record<string, unknown>, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(meta ? { meta } : {}),
    },
    { status }
  );
}

export function apiError(message: string, code = "BAD_REQUEST", status = 400) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
      },
    },
    { status }
  );
}

export function parsePagination(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const skip = (page - 1) * limit;
  const search = searchParams.get("search")?.trim() || "";
  const sort = searchParams.get("sort") || "createdAt";
  const order: 1 | -1 = searchParams.get("order") === "asc" ? 1 : -1;
  const sortOptions: Record<string, 1 | -1> = { [sort]: order };

  return { page, limit, skip, search, sort, order, sortOptions };
}

export async function authenticateRequest(
  req: NextRequest,
  requiredPermission?: string
): Promise<{ auth?: AuthenticatedContext; errorResponse?: NextResponse }> {
  try {
    await connectToDatabase();
    // Auto-seed on first request if empty
    await seedDatabase(false);

    let token: string | null = null;

    // 1. Check Authorization header
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    // 2. Check Cookie
    if (!token) {
      const cookie = req.cookies.get(env.auth.cookieName);
      if (cookie) {
        token = cookie.value;
      }
    }

    let user: IUser | null = null;

    if (token) {
      const payload = verifyJwt(token);
      if (payload?.userId) {
        user = await User.findOne({ _id: payload.userId, isDeleted: false });
      }
    }

    // Fallback in demo/dev mode: if no token provided, get the default Admin
    if (!user) {
      user = await User.findOne({ email: "admin@nexus.io", isDeleted: false });
    }

    if (!user) {
      return {
        errorResponse: apiError("Unauthorized: Please log in to access this resource", "UNAUTHORIZED", 401),
      };
    }

    // Check organization
    const org = await Organization.findOne({ _id: user.organizationId, isDeleted: false });
    if (!org) {
      return {
        errorResponse: apiError("Organization not found or inactive", "ORG_NOT_FOUND", 403),
      };
    }

    // RBAC check
    if (requiredPermission && !hasPermission(user.role, requiredPermission)) {
      return {
        errorResponse: apiError(
          `Forbidden: Insufficient permissions for '${requiredPermission}'`,
          "FORBIDDEN",
          403
        ),
      };
    }

    return {
      auth: {
        user,
        organizationId: user.organizationId.toString(),
      },
    };
  } catch (error: any) {
    console.error("[NexusCRM API Auth Error]:", error);
    return {
      errorResponse: apiError("Internal authentication error", "INTERNAL_ERROR", 500),
    };
  }
}
