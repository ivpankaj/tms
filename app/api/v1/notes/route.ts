import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { StickyNote } from "@/lib/db/models";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/v1/notes
export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim();
  const color = searchParams.get("color");
  const isArchived = searchParams.get("isArchived") === "true";

  const query: any = {
    organizationId: auth!.organizationId,
    userId: auth!.user._id,
    isDeleted: false,
    isArchived,
  };

  if (color && color !== "ALL") {
    query.color = color;
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { content: { $regex: search, $options: "i" } },
      { tags: { $regex: search, $options: "i" } },
    ];
  }

  try {
    const notes = await StickyNote.find(query)
      .sort({ isPinned: -1, zIndex: 1, updatedAt: -1 })
      .lean();

    return apiSuccess(notes);
  } catch (err: any) {
    return apiError(err.message || "Failed to fetch notes", "FETCH_ERROR", 500);
  }
}

// POST /api/v1/notes
export async function POST(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();

    // Find the current max zIndex to place the new note on top
    const topNote = await StickyNote.findOne({
      organizationId: auth!.organizationId,
      userId: auth!.user._id,
      isDeleted: false,
    }).sort({ zIndex: -1 }).select("zIndex").lean();

    const nextZIndex = ((topNote as any)?.zIndex || 1) + 1;

    const newNote = await StickyNote.create({
      organizationId: auth!.organizationId,
      userId: auth!.user._id,
      createdBy: auth!.user._id,
      title: body.title || "",
      content: body.content || "",
      color: body.color || "yellow",
      posX: typeof body.posX === "number" ? body.posX : 40 + Math.floor(Math.random() * 80),
      posY: typeof body.posY === "number" ? body.posY : 40 + Math.floor(Math.random() * 80),
      width: body.width || 280,
      height: body.height || 280,
      zIndex: nextZIndex,
      isPinned: Boolean(body.isPinned),
      isArchived: false,
      tags: Array.isArray(body.tags) ? body.tags : [],
      checklist: Array.isArray(body.checklist) ? body.checklist : [],
    });

    return apiSuccess(newNote, undefined, 201);
  } catch (err: any) {
    return apiError(err.message || "Failed to create sticky note", "CREATE_ERROR", 500);
  }
}
