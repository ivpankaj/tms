import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { Organization, User } from "@/lib/db/models";

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  const user = auth!.user;
  const currentOrg = await Organization.findOne({ _id: user.organizationId, isDeleted: false });

  if (!currentOrg) {
    return apiError("Organization not found", "ORG_NOT_FOUND", 404);
  }

  // Find all organizations this user email has access to
  const userAccounts = await User.find({ email: user.email, isDeleted: false });
  const orgIds = userAccounts.map((u) => u.organizationId);
  const organizations = await Organization.find({ _id: { $in: orgIds }, isDeleted: false });

  const defaultAdmin = (process.env.DEFAULT_ADMIN_EMAIL || "admin@cookmywork.com").toLowerCase().trim();
  const isPlatformAdmin = user.email.toLowerCase().trim() === defaultAdmin;

  return apiSuccess({
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      timezone: user.timezone,
      organizationId: user.organizationId.toString(),
      isPlatformAdmin,
    },
    organization: {
      id: currentOrg._id.toString(),
      name: currentOrg.name,
      slug: currentOrg.slug,
      currency: currentOrg.currency,
      billingPlan: currentOrg.billingPlan,
    },
    organizations: organizations.map((o) => ({
      id: o._id.toString(),
      name: o.name,
      slug: o.slug,
      currency: o.currency,
      billingPlan: o.billingPlan,
    })),
  });
}
