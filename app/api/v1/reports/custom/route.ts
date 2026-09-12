import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { Deal, Lead, Contact, Ticket, Company } from "@/lib/db/models";

export async function POST(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req, "reports:read");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const {
      entity = "deals",
      groupBy = "status",
      dateRange = "all",
      statusFilter,
    } = body;

    const orgId = auth!.organizationId;
    const query: any = { organizationId: orgId, isDeleted: false };

    if (dateRange === "last30") {
      query.createdAt = { $gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) };
    } else if (dateRange === "last90") {
      query.createdAt = { $gte: new Date(Date.now() - 90 * 24 * 3600 * 1000) };
    }

    if (statusFilter && statusFilter !== "all") {
      query.status = statusFilter;
    }

    let rawRecords: any[] = [];
    if (entity === "deals") {
      rawRecords = await Deal.find(query)
        .populate("stageId", "name probability isWon isLost")
        .populate("assignedTo", "name email");
    } else if (entity === "leads") {
      rawRecords = await Lead.find(query).populate("assignedTo", "name email");
    } else if (entity === "contacts") {
      rawRecords = await Contact.find(query).populate("companyId", "name industry");
    } else if (entity === "tickets") {
      rawRecords = await Ticket.find(query).populate("assignedTo", "name email");
    }

    // Grouping & Aggregations
    const groups: Record<
      string,
      { name: string; count: number; totalValue: number; records: any[] }
    > = {};

    rawRecords.forEach((rec) => {
      let groupKey = "Other";

      if (groupBy === "stage" && rec.stageId) {
        groupKey = rec.stageId.name || "Unknown Stage";
      } else if (groupBy === "status") {
        groupKey = rec.status || "Unknown Status";
      } else if (groupBy === "priority") {
        groupKey = rec.priority || "Medium";
      } else if (groupBy === "source") {
        groupKey = rec.source || rec.leadSource || "Direct";
      } else if (groupBy === "assignedTo" && rec.assignedTo) {
        groupKey = rec.assignedTo.name || "Unassigned";
      } else if (groupBy === "lifecycleStage") {
        groupKey = rec.lifecycleStage || "Lead";
      }

      if (!groups[groupKey]) {
        groups[groupKey] = {
          name: groupKey,
          count: 0,
          totalValue: 0,
          records: [],
        };
      }

      groups[groupKey].count += 1;
      if (rec.value) {
        groups[groupKey].totalValue += rec.value;
      }
      groups[groupKey].records.push({
        id: rec._id,
        title: rec.title || rec.subject || `${rec.firstName || ""} ${rec.lastName || ""}`.trim(),
        createdAt: rec.createdAt,
        value: rec.value || 0,
      });
    });

    const reportRows = Object.values(groups);
    const totalCount = rawRecords.length;
    const totalSum = reportRows.reduce((sum, r) => sum + r.totalValue, 0);

    return apiSuccess({
      entity,
      groupBy,
      totalCount,
      totalSum,
      rows: reportRows,
      chartData: reportRows.map((r) => ({
        name: r.name,
        count: r.count,
        totalValue: r.totalValue,
      })),
    });
  } catch (err: any) {
    return apiError(err.message || "Failed to generate report", "REPORT_ERROR", 500);
  }
}
