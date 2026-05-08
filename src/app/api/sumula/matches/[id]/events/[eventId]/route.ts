import { NextRequest } from "next/server";
import { getSessionUser, jsonError, ok } from "@/app/api/_helpers";
import { requireReferee } from "@/application/guards";
import { deleteEvent, updateEvent } from "@/application/use-cases/timeline";

export async function PATCH(
  req: NextRequest,
  ctx: { params: { id: string; eventId: string } }
) {
  try {
    const u = await getSessionUser();
    requireReferee(u);
    const body = await req.json();
    return ok(
      await updateEvent({
        matchId: ctx.params.id,
        eventId: ctx.params.eventId,
        user: { id: u.id, role: "REFEREE" },
        patch: body
      })
    );
  } catch (e) {
    return jsonError(e);
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: { id: string; eventId: string } }
) {
  try {
    const u = await getSessionUser();
    requireReferee(u);
    return ok(
      await deleteEvent({
        matchId: ctx.params.id,
        eventId: ctx.params.eventId,
        user: { id: u.id, role: "REFEREE" }
      })
    );
  } catch (e) {
    return jsonError(e);
  }
}
