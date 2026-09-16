import { QueryClient } from "@tanstack/react-query";

export interface InvalidateWorkspaceOptions {
  taskId?: string | null;
  projectId?: string | null;
  reminderId?: string | null;
}

/**
 * Invalidates all relevant TanStack Query keys across the workspace
 * so Dashboard KPIs, Task Lists, Kanban Boards, Calendars, My Tasks,
 * and Reminders update synchronously in real-time with zero manual page refreshes.
 */
export function invalidateWorkspaceQueries(
  queryClient: QueryClient,
  options?: InvalidateWorkspaceOptions
) {
  // 1. Dashboard Metrics & KPI Widgets
  queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
  queryClient.invalidateQueries({ queryKey: ["reports"] });
  queryClient.invalidateQueries({ queryKey: ["workload"] });

  // 2. Task Directories & Lists
  queryClient.invalidateQueries({ queryKey: ["tasks-list"] });
  queryClient.invalidateQueries({ queryKey: ["tasks-board"] });
  queryClient.invalidateQueries({ queryKey: ["tasks-calendar"] });
  queryClient.invalidateQueries({ queryKey: ["my-tasks"] });

  // 3. Reminders & Alerts
  queryClient.invalidateQueries({ queryKey: ["reminders"] });

  // 4. Projects & Sprints
  queryClient.invalidateQueries({ queryKey: ["projects"] });
  queryClient.invalidateQueries({ queryKey: ["projects-dropdown"] });

  if (options?.projectId) {
    queryClient.invalidateQueries({ queryKey: ["project", options.projectId] });
    queryClient.invalidateQueries({ queryKey: ["project-tasks", options.projectId] });
    queryClient.invalidateQueries({ queryKey: ["project-sprints", options.projectId] });
  } else {
    queryClient.invalidateQueries({ queryKey: ["project-tasks"] });
    queryClient.invalidateQueries({ queryKey: ["project-sprints"] });
  }

  // 5. Specific Task Details
  if (options?.taskId) {
    queryClient.invalidateQueries({ queryKey: ["task", options.taskId] });
    queryClient.invalidateQueries({ queryKey: ["task-comments", options.taskId] });
    queryClient.invalidateQueries({ queryKey: ["task-activities", options.taskId] });
    queryClient.invalidateQueries({ queryKey: ["task-timelogs", options.taskId] });
  }

  // 6. Global Activity Audit Logs
  queryClient.invalidateQueries({ queryKey: ["activities"] });
  queryClient.invalidateQueries({ queryKey: ["notifications"] });
  queryClient.invalidateQueries({ queryKey: ["notifications-inbox"] });
}
