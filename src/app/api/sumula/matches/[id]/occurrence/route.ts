import { NextRequest } from "next/server";
import { getSessionUser, jsonError, ok } from "@/app/api/_helpers";
import { requireReferee } from "@/application/guards";
import { prisma } from "@/infrastructure/db";
import { ForbiddenError, NotFoundError, ValidationError } from "@/shared/errors";

const VALID_TYPES = ["briga", "lesao", "invasao_campo", "outros"];

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const u = await getSessionUser();
    requireReferee(u);
    const body = await req.json();
    if (!VALID_TYPES.includes(body.type)) throw new ValidationError("Tipo inválido");
    if (!body.description?.trim()) throw new ValidationError("Descrição obrigatória");

    const ss = await prisma.scoresheet.findUnique({
      where: { matchId: ctx.params.id },
      include: { match: true }
    });
    if (!ss) throw new NotFoundError("Súmula não encontrada");
    if (ss.match.refereeUserId !== u.id) throw new ForbiddenError();

    const created = await prisma.occurrence.create({
      data: {
        scoresheetId: ss.id,
        type: body.type,
        description: body.description.trim(),
        playersInvolved: JSON.stringify(body.playersInvolved ?? [])
      }
    });
    return ok(created, 201);
  } catch (e) {
    return jsonError(e);
  }
}
