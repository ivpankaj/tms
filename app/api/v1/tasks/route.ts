import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError, parsePagination } from "@/lib/auth/api-auth";
import { Task, Activity, Notification } from "@/lib/db/models";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req, "tasks:read");
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const assignedTo = searchParams.get("assignedTo");
  const projectId = searchParams.get("projectId");
  const teamId = searchParams.get("teamId");
  const isPersonal = searchParams.get("isPersonal");
  const label = searchParams.get("label");
  const filterSection = searchParams.get("section"); // 'today' | 'upcoming' | 'overdue' | 'completed' | 'personal' | 'assigned_to_me'
  const calendar = searchParams.get("calendar"); // if true, fetch range without limit
  const board = searchParams.get("board"); // if true, fetch all for board
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const { page, limit, skip, search, sortOptions } = parsePagination(req);

  const sprintId = searchParams.get("sprintId");
  const issueType = searchParams.get("issueType");

  const query: any = {
    organizationId: auth!.organizationId,
    isDeleted: false,
  };

  if (status && status !== "ALL") {
    query.status = status;
  }
  if (priority && priority !== "ALL") {
    query.priority = priority;
  }
  if (issueType && issueType !== "ALL") {
    query.issueType = issueType;
  }
  if (sprintId) {
    if (sprintId === "none" || sprintId === "backlog") {
      query.sprintId = { $in: [null, undefined] };
    } else {
      query.sprintId = sprintId;
    }
  }
  if (assignedTo) {
    query.assignedTo = assignedTo;
  }
  if (projectId) {
    query.projectId = projectId;
  }
  if (teamId) {
    query.teamId = teamId;
  }
  if (isPersonal !== null && isPersonal !== undefined && isPersonal !== "") {
    query.isPersonal = isPersonal === "true";
  }
  if (label) {
    query.labels = label;
  }

  // Date filtering
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (filterSection === "today") {
    query.dueDate = { $gte: startOfToday, $lte: endOfToday };
    query.status = { $nin: ["Done", "Completed", "Cancelled"] };
  } else if (filterSection === "upcoming") {
    query.dueDate = { $gt: endOfToday };
    query.status = { $nin: ["Done", "Completed", "Cancelled"] };
  } else if (filterSection === "overdue") {
    query.dueDate = { $lt: startOfToday };
    query.status = { $nin: ["Done", "Completed", "Cancelled"] };
  } else if (filterSection === "completed") {
    query.status = { $in: ["Done", "Completed"] };
  } else if (filterSection === "personal") {
    query.isPersonal = true;
    query.assignedTo = auth!.user._id;
  } else if (filterSection === "assigned_to_me") {
    query.assignedTo = auth!.user._id;
    query.isPersonal = false;
  }

  if (startDate || endDate) {
    query.dueDate = query.dueDate || {};
    if (startDate) query.dueDate.$gte = new Date(startDate);
    if (endDate) query.dueDate.$lte = new Date(endDate);
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { labels: { $regex: search, $options: "i" } },
    ];
  }

  // Calendar or Board view: return all matched tasks
  if (calendar === "true" || board === "true") {
    const tasks = await Task.find(query)
      .populate("assignedTo", "name email avatar")
      .populate("reporterId", "name email avatar")
      .populate("projectId", "name key color")
      .populate("teamId", "name color")
      .sort({ order: 1, dueDate: 1, createdAt: -1 })
      .lean();

    return apiSuccess(tasks);
  }

  const [tasks, total] = await Promise.all([
    Task.find(query)
      .populate("assignedTo", "name email avatar")
      .populate("reporterId", "name email avatar")
      .populate("projectId", "name key color")
      .populate("teamId", "name color")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean(),
    Task.countDocuments(query),
  ]);

  return apiSuccess(tasks, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req, "tasks:write");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const {
      title,
      description,
      projectId,
      teamId,
      dueDate,
      startDate,
      priority = "Medium",
      status = "Todo",
      assignedTo,
      labels = [],
      estimatedHours = 0,
      actualHours = 0,
      parentTaskId,
      subtasks = [],
      checklist = [],
      dependencies = [],
      isPersonal = false,
      recurring,
      issueType = "task",
      storyPoints = 0,
      sprintId,
      attachments = [],
    } = body;

    if (!title || !title.trim()) {
      return apiError("Task title is required", "VALIDATION_ERROR", 400);
    }

    const task = await Task.create({
      organizationId: auth!.organizationId,
      title: title.trim(),
      description,
      projectId: projectId || undefined,
      teamId: teamId || undefined,
      sprintId: sprintId || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      priority,
      status,
      issueType,
      storyPoints: Number(storyPoints) || 0,
      assignedTo: assignedTo || auth!.user._id,
      reporterId: auth!.user._id,
      labels: Array.isArray(labels) ? labels : [],
      estimatedHours: Number(estimatedHours) || 0,
      actualHours: Number(actualHours) || 0,
      parentTaskId: parentTaskId || undefined,
      subtasks: Array.isArray(subtasks) ? subtasks : [],
      checklist: Array.isArray(checklist) ? checklist : [],
      dependencies: Array.isArray(dependencies) ? dependencies : [],
      attachments: Array.isArray(attachments) ? attachments : [],
      isPersonal: Boolean(isPersonal),
      recurring: recurring || { isRecurring: false, frequency: "none" },
      order: 0,
      createdBy: auth!.user._id,
    });

    // Create activity record
    await Activity.create({
      organizationId: auth!.organizationId,
      type: "created",
      title: "Task Created",
      details: `Created task "${task.title}"`,
      entityType: "task",
      entityId: task._id,
      createdBy: auth!.user._id,
    });

    // If assigned to someone else, create a notification
    if (assignedTo && assignedTo.toString() !== auth!.user._id.toString()) {
      await Notification.create({
        organizationId: auth!.organizationId,
        userId: assignedTo,
        title: "Task Assigned",
        message: `${auth!.user.name} assigned you the task: "${task.title}"`,
        type: "task",
        link: `/tasks?selected=${task._id}`,
        createdBy: auth!.user._id,
      });
    }

    const populated = await Task.findById(task._id)
      .populate("assignedTo", "name email avatar")
      .populate("reporterId", "name email avatar")
      .populate("projectId", "name key color")
      .populate("teamId", "name color")
      .lean();

    return apiSuccess(populated, undefined, 201);
  } catch (err: any) {
    console.error("[Tasks API Error]:", err);
    return apiError(err.message || "Failed to create task", "DATABASE_ERROR", 500);
  }
}
