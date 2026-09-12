import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { Contact, Company } from "@/lib/db/models";

export async function POST(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req, "contacts:write");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { rows, fieldMapping, deduplicateBy = "email" } = body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return apiError("No rows provided for import", "VALIDATION_ERROR", 400);
    }

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const row of rows) {
      // Map row keys according to fieldMapping
      const firstName = row[fieldMapping.firstName || "First Name"] || row["firstName"] || "";
      const lastName = row[fieldMapping.lastName || "Last Name"] || row["lastName"] || "";
      const email = (row[fieldMapping.email || "Email"] || row["email"] || "").toLowerCase().trim();
      const phone = row[fieldMapping.phone || "Phone"] || row["phone"] || "";
      const title = row[fieldMapping.title || "Job Title"] || row["title"] || "";
      const companyName = row[fieldMapping.company || "Company"] || row["company"] || "";

      if (!email && !firstName) {
        skippedCount++;
        continue;
      }

      let companyId: any = undefined;
      if (companyName) {
        let comp = await Company.findOne({
          name: { $regex: `^${companyName}$`, $options: "i" },
          organizationId: auth!.organizationId,
          isDeleted: false,
        });
        if (!comp) {
          comp = await Company.create({
            name: companyName,
            organizationId: auth!.organizationId,
            createdBy: auth!.user._id,
          });
        }
        companyId = comp._id;
      }

      // Check duplicate
      const existing = await Contact.findOne({
        email,
        organizationId: auth!.organizationId,
        isDeleted: false,
      });

      if (existing) {
        if (deduplicateBy === "update") {
          await Contact.updateOne(
            { _id: existing._id },
            {
              $set: {
                firstName: firstName || existing.firstName,
                lastName: lastName || existing.lastName,
                phone: phone || existing.phone,
                title: title || existing.title,
                ...(companyId ? { companyId } : {}),
              },
            }
          );
          updatedCount++;
        } else {
          skippedCount++;
        }
      } else {
        await Contact.create({
          organizationId: auth!.organizationId,
          firstName: firstName || "Unknown",
          lastName: lastName || "",
          email: email || `contact_${Date.now()}@imported.mock`,
          phone,
          title,
          companyId,
          leadSource: "CSV Import",
          createdBy: auth!.user._id,
        });
        createdCount++;
      }
    }

    return apiSuccess({
      totalProcessed: rows.length,
      createdCount,
      updatedCount,
      skippedCount,
    });
  } catch (err: any) {
    return apiError(err.message || "Failed to process import", "IMPORT_ERROR", 500);
  }
}
