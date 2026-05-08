import { NextRequest } from "next/server";
import { getSessionUser, jsonError, ok } from "@/app/api/_helpers";
import { requireReferee } from "@/application/guards";
import {
  endCurrentPeriod,
  reopenLastPeriod,
  startNextPeriod,
  cancelScoresheet,
  backToInPeriod
} from "@/application/use-cases/scoresheet";

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const u = await getSessionUser();
    requireReferee(u);
    const body = await req.json().catch(() => ({}));
    const action = body.action as
      | "start"
      | "end"
      | "reopen"
      | "cancel"
      | "back_to_period";
    const args = { matchId: ctx.params.id, user: { id: u.id, role: "REFEREE" as const } };
    switch (action) {
      case "start":
        return ok(await startNextPeriod(args));
      case "end":
        return ok(await endCurrentPeriod(args));
      case "reopen":
        return ok(await reopenLastPeriod(args));
      case "cancel":
        return ok(await cancelScoresheet(args));
      case "back_to_period":
        return ok(await backToInPeriod(args));
      default:
        throw new Error("action inválida");
    }
  } catch (e) {
    return jsonError(e);
  }
}
