import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { Task, Project, Team, Activity, User } from "@/lib/db/models";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req, "reports:read");
  if (errorResponse) return errorResponse;

  const orgId = auth!.organizationId;

  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const dayOfWeek = now.getDay() || 7;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    const [allTasks, rawProjects, users, activities] = await Promise.all([
      Task.find({ organizationId: orgId, isDeleted: false })
        .populate("assignedTo", "name email avatar")
        .populate("projectId", "name key color")
        .sort({ dueDate: 1, createdAt: -1 }),
      Project.find({ organizationId: orgId, isDeleted: false })
        .populate("ownerId", "name email avatar")
        .populate("members", "name email avatar")
        .sort({ updatedAt: -1 }),
      User.find({ organizationId: orgId, isDeleted: false }).select("name email avatar role"),
      Activity.find({ organizationId: orgId, isDeleted: false })
        .populate("createdBy", "name email avatar")
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    // KPI Calculations
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(
      (t) => t.status === "Done" || t.status === "Completed"
    ).length;
    const inProgressTasks = allTasks.filter((t) => t.status === "In Progress").length;
    const overdueTasks = allTasks.filter(
      (t) =>
        t.status !== "Done" &&
        t.status !== "Completed" &&
        t.status !== "Cancelled" &&
        t.dueDate &&
        new Date(t.dueDate) < startOfToday
    ).length;
    const dueTodayTasks = allTasks.filter(
      (t) =>
        t.status !== "Done" &&
        t.status !== "Completed" &&
        t.status !== "Cancelled" &&
        t.dueDate &&
        new Date(t.dueDate) >= startOfToday &&
        new Date(t.dueDate) <= endOfToday
    ).length;
    const upcomingTasks = allTasks.filter(
      (t) =>
        t.status !== "Done" &&
        t.status !== "Completed" &&
        t.status !== "Cancelled" &&
        t.dueDate &&
        new Date(t.dueDate) > endOfToday
    ).length;

    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const tasksCompletedThisWeek = allTasks.filter(
      (t) =>
        (t.status === "Done" || t.status === "Completed") &&
        new Date(t.updatedAt) >= startOfWeek
    ).length;

    const tasksCreatedThisWeek = allTasks.filter(
      (t) => new Date(t.createdAt) >= startOfWeek
    ).length;

    // Status breakdown
    const statusCounts: Record<string, number> = {
      Backlog: 0,
      Todo: 0,
      "In Progress": 0,
      "In Review": 0,
      Done: 0,
    };
    allTasks.forEach((t) => {
      const s = t.status === "Completed" ? "Done" : t.status;
      if (statusCounts[s] !== undefined) {
        statusCounts[s] += 1;
      } else {
        statusCounts[s] = 1;
      }
    });

    const statusBreakdown = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    }));

    // Priority breakdown
    const priorityCounts: Record<string, number> = {
      Urgent: 0,
      High: 0,
      Medium: 0,
      Low: 0,
    };
    allTasks.forEach((t) => {
      const p = t.priority === "No Priority" ? "Low" : t.priority;
      if (priorityCounts[p] !== undefined) {
        priorityCounts[p] += 1;
      }
    });

    const priorityBreakdown = Object.entries(priorityCounts).map(([priority, count]) => ({
      priority,
      count,
    }));

    // Team Workload
    const userWorkloadMap: Record<
      string,
      { user: any; total: number; completed: number; inProgress: number }
    > = {};

    users.forEach((u) => {
      userWorkloadMap[u._id.toString()] = {
        user: u,
        total: 0,
        completed: 0,
        inProgress: 0,
      };
    });

    allTasks.forEach((t) => {
      const assigneeId = t.assignedTo?._id?.toString() || (t.assignedTo as any)?.toString();
      if (assigneeId && userWorkloadMap[assigneeId]) {
        userWorkloadMap[assigneeId].total += 1;
        if (t.status === "Done" || t.status === "Completed") {
          userWorkloadMap[assigneeId].completed += 1;
        } else if (t.status === "In Progress") {
          userWorkloadMap[assigneeId].inProgress += 1;
        }
      }
    });

    const teamWorkload = Object.values(userWorkloadMap)
      .filter((w) => w.total > 0)
      .map((w) => ({
        name: w.user.name,
        email: w.user.email,
        avatar: w.user.avatar,
        role: w.user.role,
        total: w.total,
        completed: w.completed,
        inProgress: w.inProgress,
      }))
      .sort((a, b) => b.total - a.total);

    // Active Project Progress
    const projectProgress = rawProjects.map((p) => {
      const projTasks = allTasks.filter(
        (t) => (t.projectId as any)?._id?.toString() === p._id.toString()
      );
      const pCompleted = projTasks.filter(
        (t) => t.status === "Done" || t.status === "Completed"
      ).length;
      const progress =
        projTasks.length > 0
          ? Math.round((pCompleted / projTasks.length) * 100)
          : p.progress || 0;

      return {
        _id: p._id,
        name: p.name,
        key: p.key,
        status: p.status,
        priority: p.priority,
        progress,
        taskCount: projTasks.length,
        completedTasks: pCompleted,
        dueDate: p.dueDate,
        color: p.color,
        members: p.members,
      };
    });

    // My Tasks compact list for current authenticated user
    const myTasks = allTasks
      .filter((t) => {
        const aId = t.assignedTo?._id?.toString() || (t.assignedTo as any)?.toString();
        return (
          aId === auth!.user._id.toString() &&
          t.status !== "Done" &&
          t.status !== "Completed" &&
          t.status !== "Cancelled"
        );
      })
      .slice(0, 8);

    // Completion Velocity Trendline (last 6 weeks)
    const completionTrend = [];
    for (let i = 5; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const label = `Week ${6 - i}`;
      const completedCount = allTasks.filter(
        (t) =>
          (t.status === "Done" || t.status === "Completed") &&
          new Date(t.updatedAt) >= weekStart &&
          new Date(t.updatedAt) < weekEnd
      ).length;
      const createdCount = allTasks.filter(
        (t) => new Date(t.createdAt) >= weekStart && new Date(t.createdAt) < weekEnd
      ).length;

      completionTrend.push({
        label,
        completed: completedCount,
        created: createdCount,
      });
    }

    return apiSuccess({
      kpi: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        dueTodayTasks,
        upcomingTasks,
        completionRate,
        tasksCompletedThisWeek,
        tasksCreatedThisWeek,
      },
      statusBreakdown,
      priorityBreakdown,
      teamWorkload,
      projectProgress,
      myTasks,
      recentActivities: activities,
      completionTrend,
    });
  } catch (err: any) {
    console.error("[Dashboard Reports Error]:", err);
    return apiError(err.message || "Failed to load dashboard metrics", "DATABASE_ERROR", 500);
  }
}
