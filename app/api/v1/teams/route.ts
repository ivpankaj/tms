import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { Team, Task, Project } from "@/lib/db/models";

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req, "teams:read");
  if (errorResponse) return errorResponse;

  const rawTeams = await Team.find({
    organizationId: auth!.organizationId,
    isDeleted: false,
  })
    .populate("leaderId", "name email avatar")
    .populate("members", "name email avatar")
    .sort({ name: 1 });

  const teams = await Promise.all(
    rawTeams.map(async (t) => {
      const [taskCount, projectCount] = await Promise.all([
        Task.countDocuments({ teamId: t._id, isDeleted: false }),
        Project.countDocuments({
          organizationId: auth!.organizationId,
          isDeleted: false,
          members: { $in: t.members },
        }),
      ]);

      return {
        ...t.toObject(),
        taskCount,
        projectCount,
      };
    })
  );

  return apiSuccess(teams);
}

export async function POST(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req, "teams:write");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { name, description, leaderId, members = [], color = "#6366f1" } = body;

    if (!name || !name.trim()) {
      return apiError("Team name is required", "VALIDATION_ERROR", 400);
    }

    const team = await Team.create({
      organizationId: auth!.organizationId,
      name: name.trim(),
      description,
      leaderId: leaderId || auth!.user._id,
      members: Array.isArray(members) && members.length > 0 ? members : [auth!.user._id],
      color,
      createdBy: auth!.user._id,
    });

    const populated = await Team.findById(team._id)
      .populate("leaderId", "name email avatar")
      .populate("members", "name email avatar");

    return apiSuccess(populated, undefined, 201);
  } catch (err: any) {
    return apiError(err.message || "Failed to create team", "DATABASE_ERROR", 500);
  }
}
