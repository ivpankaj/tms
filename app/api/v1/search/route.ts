import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { Task, Project, Team, User } from "@/lib/db/models";

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return apiSuccess({ tasks: [], projects: [], teams: [], members: [] });
  }

  const orgId = auth!.organizationId;
  const regex = { $regex: q, $options: "i" };

  const [tasks, projects, teams, members] = await Promise.all([
    Task.find({
      organizationId: orgId,
      isDeleted: false,
      $or: [{ title: regex }, { description: regex }, { labels: regex }],
    })
      .select("title priority status dueDate labels projectId")
      .populate("projectId", "name key")
      .limit(8),

    Project.find({
      organizationId: orgId,
      isDeleted: false,
      $or: [{ name: regex }, { key: regex }, { description: regex }],
    })
      .select("name key status progress color")
      .limit(6),

    Team.find({
      organizationId: orgId,
      isDeleted: false,
      $or: [{ name: regex }, { description: regex }],
    })
      .select("name description color")
      .limit(6),

    User.find({
      organizationId: orgId,
      isDeleted: false,
      $or: [{ name: regex }, { email: regex }, { role: regex }],
    })
      .select("name email avatar role")
      .limit(6),
  ]);

  return apiSuccess({
    tasks,
    projects,
    teams,
    members,
  });
}
