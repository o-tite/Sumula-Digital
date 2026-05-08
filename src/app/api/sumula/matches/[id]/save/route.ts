import { NextRequest } from "next/server";
import { getSessionUser, jsonError, ok } from "@/app/api/_helpers";
import { requireReferee } from "@/application/guards";
import { saveScoresheet } from "@/application/use-cases/scoresheet";
import { buildScoresheetDocument } from "@/application/use-cases/share";
import { prisma } from "@/infrastructure/db";

export async function POST(_req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const u = await getSessionUser();
    requireReferee(u);
    const saved = await saveScoresheet({
      matchId: ctx.params.id,
      user: { id: u.id, role: "REFEREE" }
    });
    const doc = await buildScoresheetDocument(ctx.params.id);
    await prisma.scoresheet.update({
      where: { id: saved.id },
      data: { shareDocText: doc }
    });
    return ok({ saved, shareDocText: doc });
  } catch (e) {
    return jsonError(e);
  }
}
