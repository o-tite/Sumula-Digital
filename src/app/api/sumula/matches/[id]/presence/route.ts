import { NextRequest } from "next/server";
import { getSessionUser, jsonError, ok } from "@/app/api/_helpers";
import { requireReferee } from "@/application/guards";
import { setPresence } from "@/application/use-cases/scoresheet";
import { getMatchForReferee } from "@/application/use-cases/matches";

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const u = await getSessionUser();
    requireReferee(u);
    const match = await getMatchForReferee(ctx.params.id, u.id);
    if (!match.scoresheet) throw new Error("Súmula ainda não criada");
    const body = await req.json();
    return ok(
      await setPresence({
        scoresheetId: match.scoresheet.id,
        playerId: body.playerId,
        present: body.present,
        jerseyNumber: body.jerseyNumber ?? null,
        absenceType: body.absenceType ?? null,
        user: { id: u.id, role: "REFEREE" }
      })
    );
  } catch (e) {
    return jsonError(e);
  }
}
