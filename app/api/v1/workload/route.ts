import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { User, Task } from "@/lib/db/models";

// GET /api/v1/workload - Aggregate member workload and capacity
export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req, "tasks:read");
  if (errorResponse) return errorResponse;

  try {
    const users = await User.find({
      organizationId: auth!.organizationId,
      status: "active",
      isDeleted: false,
    }).select("name email avatar role");

    const activeTasks = await Task.find({
      organizationId: auth!.organizationId,
      status: { $nin: ["Done", "Cancelled", "Completed"] },
      isDeleted: false,
    })
      .populate("projectId", "name key color")
      .select("title priority status estimatedHours actualHours assignedTo dueDate projectId");

    const weeklyCapacity = 40; // 40 hours/week standard capacity

    const workloadData = users.map((user) => {
      const userTasks = activeTasks.filter(
        (t) => t.assignedTo && t.assignedTo.toString() === user._id.toString()
      );

      const totalTasks = userTasks.length;
      const estimatedHours = userTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
      const actualHours = userTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);

      const capacityUtilization = Math.round((estimatedHours / weeklyCapacity) * 100);

      let status: "under_allocated" | "optimal" | "over_allocated" = "optimal";
      if (estimatedHours < 25) {
        status = "under_allocated";
      } else if (estimatedHours > 40) {
        status = "over_allocated";
      }

      return {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
        },
        totalTasks,
        estimatedHours,
        actualHours,
        weeklyCapacity,
        capacityUtilization,
        status,
        tasks: userTasks.slice(0, 5), // top tasks
      };
    });

    // Summary statistics
    const totalAssignedTasks = activeTasks.length;
    const totalEstimatedHours = workloadData.reduce((sum, w) => sum + w.estimatedHours, 0);
    const overAllocatedMembers = workloadData.filter((w) => w.status === "over_allocated").length;

    return apiSuccess({
      workload: workloadData.sort((a, b) => b.estimatedHours - a.estimatedHours),
      summary: {
        totalTeamMembers: users.length,
        totalAssignedTasks,
        totalEstimatedHours,
        overAllocatedMembers,
      },
    });
  } catch (err: any) {
    return apiError(err.message || "Failed to fetch workload data", "DATABASE_ERROR", 500);
  }
}
