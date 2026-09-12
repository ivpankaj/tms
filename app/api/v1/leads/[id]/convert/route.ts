import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { Lead, Contact, Company, Deal, Pipeline, PipelineStage, Activity } from "@/lib/db/models";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { auth, errorResponse } = await authenticateRequest(req, "leads:write");
  if (errorResponse) return errorResponse;

  try {
    const lead = await Lead.findOne({
      _id: id,
      organizationId: auth!.organizationId,
      isDeleted: false,
    });

    if (!lead) {
      return apiError("Lead not found", "NOT_FOUND", 404);
    }

    if (lead.status === "Converted") {
      return apiError("Lead is already converted", "ALREADY_CONVERTED", 400);
    }

    const body = await req.json().catch(() => ({}));
    const {
      createDeal = true,
      dealTitle = `${lead.company || lead.lastName} Enterprise Deal`,
      dealValue = 25000,
      pipelineId,
      stageId,
    } = body;

    // 1. Find or create Company
    let companyId: any = undefined;
    if (lead.company) {
      let company = await Company.findOne({
        name: { $regex: `^${lead.company.trim()}$`, $options: "i" },
        organizationId: auth!.organizationId,
        isDeleted: false,
      });

      if (!company) {
        company = await Company.create({
          organizationId: auth!.organizationId,
          name: lead.company.trim(),
          phone: lead.phone,
          createdBy: auth!.user._id,
        });
      }
      companyId = company._id;
    }

    // 2. Find or create Contact
    let contact = await Contact.findOne({
      email: lead.email,
      organizationId: auth!.organizationId,
      isDeleted: false,
    });

    if (!contact) {
      contact = await Contact.create({
        organizationId: auth!.organizationId,
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        title: lead.title,
        companyId,
        leadSource: lead.source,
        lifecycleStage: "Opportunity",
        tags: ["Converted Lead"],
        createdBy: auth!.user._id,
      });
    }

    // 3. Create Deal if requested
    let createdDeal: any = null;
    if (createDeal) {
      let targetPipelineId = pipelineId;
      let targetStageId = stageId;

      if (!targetPipelineId) {
        const defaultPipe = await Pipeline.findOne({
          organizationId: auth!.organizationId,
          isDefault: true,
          isDeleted: false,
        });
        targetPipelineId = defaultPipe?._id;
      }

      if (!targetStageId && targetPipelineId) {
        const firstStage = await PipelineStage.findOne({
          pipelineId: targetPipelineId,
          organizationId: auth!.organizationId,
          isDeleted: false,
        }).sort({ order: 1 });
        targetStageId = firstStage?._id;
      }

      if (targetPipelineId && targetStageId) {
        const expectedClose = new Date();
        expectedClose.setDate(expectedClose.getDate() + 30);

        createdDeal = await Deal.create({
          organizationId: auth!.organizationId,
          title: dealTitle,
          value: Number(dealValue) || 25000,
          currency: "USD",
          pipelineId: targetPipelineId,
          stageId: targetStageId,
          companyId,
          contactId: contact._id,
          assignedTo: lead.assignedTo || auth!.user._id,
          probability: 30,
          expectedCloseDate: expectedClose,
          createdBy: auth!.user._id,
        });
      }
    }

    // 4. Update Lead to Converted
    lead.status = "Converted";
    lead.convertedContactId = contact._id as any;
    if (createdDeal) {
      lead.convertedDealId = createdDeal._id as any;
    }
    await lead.save();

    // 5. Log Activity
    await Activity.create({
      organizationId: auth!.organizationId,
      type: "status_change",
      title: "Lead Converted",
      details: `Lead ${lead.firstName} ${lead.lastName} converted to Contact ${contact.firstName} ${contact.lastName}${createdDeal ? ` and Deal '${createdDeal.title}'` : ""}`,
      entityType: "contact",
      entityId: contact._id,
      createdBy: auth!.user._id,
    });

    return apiSuccess({
      lead,
      contact,
      companyId,
      deal: createdDeal,
    });
  } catch (err: any) {
    console.error("Conversion error:", err);
    return apiError(err.message || "Failed to convert lead", "CONVERSION_ERROR", 500);
  }
}
