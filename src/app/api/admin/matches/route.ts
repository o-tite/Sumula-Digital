export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { getSessionUser, jsonError, ok } from "@/app/api/_helpers";
import { requireOrganizer } from "@/application/guards";
import { createMatch } from "@/application/use-cases/matches";

export async function POST(req: NextRequest) {
  try {
    const u = await getSessionUser();
    requireOrganizer(u);
    const body = await req.json();
    return ok(
      await createMatch({
        roundId: body.roundId,
        homeTeamId: body.homeTeamId,
        awayTeamId: body.awayTeamId,
        refereeUserId: body.refereeUserId,
        refereeNameText: body.refereeNameText,
        homeResponsible: body.homeResponsible,
        awayResponsible: body.awayResponsible,
        scheduledAt: new Date(body.scheduledAt),
        venue: body.venue
      }),
      201
    );
  } catch (e) {
    return jsonError(e);
  }
}
