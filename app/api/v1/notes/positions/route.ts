import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess, apiError } from "@/lib/auth/api-auth";
import { StickyNote } from "@/lib/db/models";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// PUT /api/v1/notes/positions - Batch update note coordinates / layout
export async function PUT(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { positions } = body; // Array of { id: string, posX: number, posY: number, zIndex?: number }

    if (!Array.isArray(positions) || positions.length === 0) {
      return apiError("Positions array is required", "VALIDATION_ERROR", 400);
    }

    const bulkOps = positions.map((p) => ({
      updateOne: {
        filter: {
          _id: p.id,
          organizationId: auth!.organizationId,
          userId: auth!.user._id,
          isDeleted: false,
        },
        update: {
          $set: {
            posX: p.posX,
            posY: p.posY,
            ...(p.zIndex !== undefined ? { zIndex: p.zIndex } : {}),
          },
        },
      },
    }));

    await StickyNote.bulkWrite(bulkOps);

    return apiSuccess({ message: "Positions updated successfully", count: positions.length });
  } catch (err: any) {
    return apiError(err.message || "Failed to batch update positions", "BATCH_UPDATE_ERROR", 500);
  }
}
