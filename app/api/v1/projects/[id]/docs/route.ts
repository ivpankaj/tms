import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { ProjectDoc } from "@/lib/db/models";

// GET /api/v1/projects/[id]/docs - Get project documents
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { auth, errorResponse } = await authenticateRequest(req, "projects:read");
  if (errorResponse) return errorResponse;

  try {
    const docs = await ProjectDoc.find({
      projectId: id,
      organizationId: auth!.organizationId,
      isDeleted: false,
    })
      .populate("createdBy", "name email avatar")
      .populate("updatedBy", "name email avatar")
      .sort({ updatedAt: -1 });

    return apiSuccess(docs);
  } catch (err: any) {
    return apiError(err.message || "Failed to fetch docs", "DATABASE_ERROR", 500);
  }
}

// POST /api/v1/projects/[id]/docs - Create new document
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { auth, errorResponse } = await authenticateRequest(req, "projects:write");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { title, content, category = "General", tags = [] } = body;

    if (!title?.trim()) {
      return apiError("Document title is required", "VALIDATION_ERROR", 400);
    }

    const doc = await ProjectDoc.create({
      organizationId: auth!.organizationId,
      projectId: id,
      title: title.trim(),
      content: content || "",
      category,
      tags,
      createdBy: auth!.user._id,
      updatedBy: auth!.user._id,
    });

    const populated = await ProjectDoc.findById(doc._id)
      .populate("createdBy", "name email avatar")
      .populate("updatedBy", "name email avatar");

    return apiSuccess(populated, undefined, 201);
  } catch (err: any) {
    return apiError(err.message || "Failed to create document", "DATABASE_ERROR", 500);
  }
}

// PATCH /api/v1/projects/[id]/docs - Update an existing document
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { auth, errorResponse } = await authenticateRequest(req, "projects:write");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { docId, title, content, category, tags } = body;

    if (!docId) {
      return apiError("docId is required", "VALIDATION_ERROR", 400);
    }

    const updateData: any = { updatedBy: auth!.user._id };
    if (title !== undefined) updateData.title = title.trim();
    if (content !== undefined) updateData.content = content;
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined) updateData.tags = tags;

    const doc = await ProjectDoc.findOneAndUpdate(
      { _id: docId, projectId: id, organizationId: auth!.organizationId },
      { $set: updateData },
      { new: true }
    )
      .populate("createdBy", "name email avatar")
      .populate("updatedBy", "name email avatar");

    if (!doc) {
      return apiError("Document not found", "NOT_FOUND", 404);
    }

    return apiSuccess(doc);
  } catch (err: any) {
    return apiError(err.message || "Failed to update document", "DATABASE_ERROR", 500);
  }
}

// DELETE /api/v1/projects/[id]/docs - Soft delete a document
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { auth, errorResponse } = await authenticateRequest(req, "projects:write");
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const docId = searchParams.get("docId");

    if (!docId) {
      return apiError("docId query parameter is required", "VALIDATION_ERROR", 400);
    }

    await ProjectDoc.findOneAndUpdate(
      { _id: docId, projectId: id, organizationId: auth!.organizationId },
      { isDeleted: true }
    );

    return apiSuccess({ deleted: true });
  } catch (err: any) {
    return apiError(err.message || "Failed to delete document", "DATABASE_ERROR", 500);
  }
}
