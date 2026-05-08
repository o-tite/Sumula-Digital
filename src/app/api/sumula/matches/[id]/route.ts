import { NextRequest } from "next/server";
import { getSessionUser, jsonError, ok } from "@/app/api/_helpers";
import { requireReferee } from "@/application/guards";
import { getMatchForReferee } from "@/application/use-cases/matches";
import { getOrCreateScoresheet } from "@/application/use-cases/scoresheet";

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const u = await getSessionUser();
    requireReferee(u);
    const match = await getMatchForReferee(ctx.params.id, u.id);
    if (!match.scoresheet) {
      await getOrCreateScoresheet(match.id, { id: u.id, role: "REFEREE" });
      const refreshed = await getMatchForReferee(ctx.params.id, u.id);
      return ok(refreshed);
    }
    return ok(match);
  } catch (e) {
    return jsonError(e);
  }
}
