import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError, parsePagination } from "@/lib/auth/api-auth";
import { Project, Task, Activity } from "@/lib/db/models";

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req, "projects:read");
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const { page, limit, skip, search, sortOptions } = parsePagination(req);

  const query: any = {
    organizationId: auth!.organizationId,
    isDeleted: false,
  };

  if (status && status !== "ALL") query.status = status;
  if (priority && priority !== "ALL") query.priority = priority;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { key: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const [rawProjects, total] = await Promise.all([
    Project.find(query)
      .populate("ownerId", "name email avatar")
      .populate("members", "name email avatar")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit),
    Project.countDocuments(query),
  ]);

  // Augment each project with real-time task counts
  const projects = await Promise.all(
    rawProjects.map(async (p) => {
      const [totalTasks, completedTasks] = await Promise.all([
        Task.countDocuments({ projectId: p._id, isDeleted: false }),
        Task.countDocuments({
          projectId: p._id,
          status: { $in: ["Done", "Completed"] },
          isDeleted: false,
        }),
      ]);

      const progress =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : p.progress || 0;

      const obj = p.toObject();
      return {
        ...obj,
        totalTasks,
        completedTasks,
        progress,
      };
    })
  );

  return apiSuccess(projects, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req, "projects:write");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const {
      name,
      key,
      description,
      ownerId,
      members = [],
      status = "Active",
      priority = "Medium",
      startDate,
      dueDate,
      color = "#3b82f6",
      tags = [],
      milestones = [],
    } = body;

    if (!name || !name.trim()) {
      return apiError("Project name is required", "VALIDATION_ERROR", 400);
    }

    const projectKey = (key || name.slice(0, 3)).trim().toUpperCase();

    const project = await Project.create({
      organizationId: auth!.organizationId,
      name: name.trim(),
      key: projectKey,
      description,
      ownerId: ownerId || auth!.user._id,
      members: Array.isArray(members) && members.length > 0 ? members : [auth!.user._id],
      status,
      priority,
      startDate: startDate ? new Date(startDate) : undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      progress: 0,
      color,
      tags: Array.isArray(tags) ? tags : [],
      milestones: Array.isArray(milestones) ? milestones : [],
      createdBy: auth!.user._id,
    });

    await Activity.create({
      organizationId: auth!.organizationId,
      type: "created",
      title: "Project Created",
      details: `Created project "${project.name}" (${project.key})`,
      entityType: "project",
      entityId: project._id,
      createdBy: auth!.user._id,
    });

    const populated = await Project.findById(project._id)
      .populate("ownerId", "name email avatar")
      .populate("members", "name email avatar");

    return apiSuccess(populated, undefined, 201);
  } catch (err: any) {
    console.error("[Create Project Error]:", err);
    return apiError(err.message || "Failed to create project", "DATABASE_ERROR", 500);
  }
}
