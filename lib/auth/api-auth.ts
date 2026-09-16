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

// In-Memory Fast Authentication Cache (TTL 45 seconds)
interface CachedAuth {
  user: any;
  organizationId: string;
  role: string;
  cachedAt: number;
}

const authCache = new Map<string, CachedAuth>();
const AUTH_CACHE_TTL_MS = 45 * 1000; // 45 seconds
let hasCheckedInitialSeed = false;

export function clearAuthCache(userId?: string) {
  if (userId) {
    for (const [key, value] of authCache.entries()) {
      if (value.user?._id?.toString() === userId || value.user?.id === userId) {
        authCache.delete(key);
      }
    }
  } else {
    authCache.clear();
  }
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

    if (!token) {
      return {
        errorResponse: apiError("Unauthorized: Please log in to access this resource", "UNAUTHORIZED", 401),
      };
    }

    // 3. Check In-Memory High-Speed Cache (<0.1ms response)
    const cached = authCache.get(token);
    const now = Date.now();
    if (cached && now - cached.cachedAt < AUTH_CACHE_TTL_MS) {
      if (requiredPermission && !hasPermission(cached.role, requiredPermission)) {
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
          user: cached.user,
          organizationId: cached.organizationId,
        },
      };
    }

    // 4. Connect to database if not connected
    await connectToDatabase();

    // Run seed check only once on startup in background
    if (!hasCheckedInitialSeed) {
      hasCheckedInitialSeed = true;
      seedDatabase(false).catch((e) => console.warn("[Cookmywork] Seed check:", e.message));
    }

    // Verify JWT
    const payload = verifyJwt(token);
    if (!payload?.userId) {
      return {
        errorResponse: apiError("Unauthorized: Invalid session token", "UNAUTHORIZED", 401),
      };
    }

    // 5. Query user with lean() for maximum performance
    const user = await User.findOne({ _id: payload.userId, isDeleted: false })
      .select("name email role organizationId status avatar timezone")
      .lean();

    if (!user || user.status === "deactivated") {
      return {
        errorResponse: apiError("Unauthorized: Account not found or deactivated", "UNAUTHORIZED", 401),
      };
    }

    const orgId = user.organizationId?.toString();
    if (!orgId) {
      return {
        errorResponse: apiError("Organization not assigned", "ORG_NOT_FOUND", 403),
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

    // Save to high-speed in-memory cache
    authCache.set(token, {
      user: user as any,
      organizationId: orgId,
      role: user.role,
      cachedAt: now,
    });

    return {
      auth: {
        user: user as any,
        organizationId: orgId,
      },
    };
  } catch (error: any) {
    console.error("[Cookmywork API Auth Error]:", error);
    return {
      errorResponse: apiError("Internal authentication error", "INTERNAL_ERROR", 500),
    };
  }
}
