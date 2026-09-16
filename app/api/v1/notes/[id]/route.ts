import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { StickyNote } from "@/lib/db/models";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/v1/notes/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  const { id } = await params;

  try {
    const note = await StickyNote.findOne({
      _id: id,
      organizationId: auth!.organizationId,
      userId: auth!.user._id,
      isDeleted: false,
    }).lean();

    if (!note) {
      return apiError("Note not found", "NOT_FOUND", 404);
    }

    return apiSuccess(note);
  } catch (err: any) {
    return apiError(err.message || "Failed to fetch note", "FETCH_ERROR", 500);
  }
}

// PATCH /api/v1/notes/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  const { id } = await params;

  try {
    const body = await req.json();

    const allowedFields = [
      "title",
      "content",
      "color",
      "posX",
      "posY",
      "width",
      "height",
      "zIndex",
      "isPinned",
      "isArchived",
      "tags",
      "checklist",
    ];

    const updates: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    const updatedNote = await StickyNote.findOneAndUpdate(
      {
        _id: id,
        organizationId: auth!.organizationId,
        userId: auth!.user._id,
        isDeleted: false,
      },
      { $set: updates },
      { new: true }
    ).lean();

    if (!updatedNote) {
      return apiError("Note not found or permission denied", "NOT_FOUND", 404);
    }

    return apiSuccess(updatedNote);
  } catch (err: any) {
    return apiError(err.message || "Failed to update note", "UPDATE_ERROR", 500);
  }
}

// DELETE /api/v1/notes/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  const { id } = await params;

  try {
    const deletedNote = await StickyNote.findOneAndUpdate(
      {
        _id: id,
        organizationId: auth!.organizationId,
        userId: auth!.user._id,
        isDeleted: false,
      },
      { $set: { isDeleted: true } },
      { new: true }
    ).lean();

    if (!deletedNote) {
      return apiError("Note not found or permission denied", "NOT_FOUND", 404);
    }

    return apiSuccess({ message: "Note deleted successfully", id });
  } catch (err: any) {
    return apiError(err.message || "Failed to delete note", "DELETE_ERROR", 500);
  }
}
