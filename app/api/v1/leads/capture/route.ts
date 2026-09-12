import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/connection";
import { Lead, Organization, Notification, User } from "@/lib/db/models";
import { calculateLeadScore } from "@/lib/utils/lead-scorer";
import { apiSuccess, apiError } from "@/lib/auth/api-auth";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const body = await req.json();
    const { firstName, lastName, email, phone, company, title, source, orgSlug } = body;

    if (!firstName || !email) {
      return apiError("firstName and email are required", "VALIDATION_ERROR", 400);
    }

    // Find organization by slug or fallback to default
    let org = null;
    if (orgSlug) {
      org = await Organization.findOne({ slug: orgSlug, isDeleted: false });
    }
    if (!org) {
      org = await Organization.findOne({ isDeleted: false });
    }

    if (!org) {
      return apiError("Organization not found", "NOT_FOUND", 404);
    }

    const score = calculateLeadScore({ title, company, source: source || "Public Web Form", email, phone });

    // Round-robin lead assignment: pick an active Sales Rep
    const salesReps = await User.find({
      organizationId: org._id,
      role: { $in: ["Sales Rep", "Manager"] },
      isDeleted: false,
    });
    const assignedUser = salesReps.length > 0 ? salesReps[Math.floor(Math.random() * salesReps.length)] : undefined;

    const lead = await Lead.create({
      organizationId: org._id,
      firstName,
      lastName: lastName || "",
      email: email.toLowerCase().trim(),
      phone,
      company,
      title,
      source: source || "Public Web Form",
      score,
      status: "New",
      assignedTo: assignedUser?._id,
    });

    // Send notification to assignee
    if (assignedUser) {
      await Notification.create({
        organizationId: org._id,
        userId: assignedUser._id,
        title: "New Lead Captured! 🎯",
        message: `${firstName} ${lastName || ""} from ${company || "a new organization"} just submitted your web form (Score: ${score}).`,
        type: "info",
        isRead: false,
        link: "/leads",
      });
    }

    return apiSuccess({
      leadId: lead._id,
      message: "Lead successfully captured",
      status: "received",
    }, undefined, 201);
  } catch (err: any) {
    console.error("Lead capture error:", err);
    return apiError(err.message || "Failed to capture lead", "CAPTURE_ERROR", 500);
  }
}
