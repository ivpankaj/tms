import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";
import { Contact } from "@/lib/db/models";
import Papa from "papaparse";

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req, "contacts:read");
  if (errorResponse) return errorResponse;

  const contacts = await Contact.find({
    organizationId: auth!.organizationId,
    isDeleted: false,
  }).populate("companyId", "name");

  const exportData = contacts.map((c: any) => ({
    "First Name": c.firstName,
    "Last Name": c.lastName,
    Email: c.email,
    Phone: c.phone || "",
    "Job Title": c.title || "",
    Company: c.companyId?.name || "",
    "Lifecycle Stage": c.lifecycleStage,
    "Lead Source": c.leadSource,
    Tags: (c.tags || []).join(", "),
    "Created Date": c.createdAt?.toISOString(),
  }));

  const csv = Papa.unparse(exportData);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="contacts-export-${Date.now()}.csv"`,
    },
  });
}
