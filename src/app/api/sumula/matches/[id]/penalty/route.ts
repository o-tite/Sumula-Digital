import { NextRequest } from "next/server";
import { getSessionUser, jsonError, ok } from "@/app/api/_helpers";
import { requireReferee } from "@/application/guards";
import {
  recordPenaltyKick,
  undoLastPenaltyKick,
  confirmPenaltyResult
} from "@/application/use-cases/penalty";

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const u = await getSessionUser();
    requireReferee(u);
    const body = await req.json();
    const args = { matchId: ctx.params.id, user: { id: u.id, role: "REFEREE" as const } };
    if (body.action === "record") {
      return ok(
        await recordPenaltyKick({
          ...args,
          teamId: body.teamId,
          playerId: body.playerId,
          converted: body.converted
        })
      );
    }
    if (body.action === "undo") return ok(await undoLastPenaltyKick(args));
    if (body.action === "confirm") return ok(await confirmPenaltyResult(args));
    throw new Error("action inválida");
  } catch (e) {
    return jsonError(e);
  }
}
