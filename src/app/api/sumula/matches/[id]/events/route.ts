import { NextRequest } from "next/server";
import { getSessionUser, jsonError, ok } from "@/app/api/_helpers";
import { requireReferee } from "@/application/guards";
import { registerEvent } from "@/application/use-cases/timeline";

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const u = await getSessionUser();
    requireReferee(u);
    const body = await req.json();
    return ok(
      await registerEvent({
        matchId: ctx.params.id,
        user: { id: u.id, role: "REFEREE" },
        type: body.type,
        teamId: body.teamId,
        playerId: body.playerId ?? null,
        secondaryPlayerId: body.secondaryPlayerId ?? null,
        clientEventId: body.clientEventId
      }),
      201
    );
  } catch (e) {
    return jsonError(e);
  }
}
