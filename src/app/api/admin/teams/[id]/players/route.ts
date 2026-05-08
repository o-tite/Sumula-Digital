import { NextRequest } from "next/server";
import { getSessionUser, jsonError, ok } from "@/app/api/_helpers";
import { requireOrganizer } from "@/application/guards";
import { createPlayer, listPlayers } from "@/application/use-cases/players";

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const u = await getSessionUser();
    requireOrganizer(u);
    return ok(await listPlayers(ctx.params.id));
  } catch (e) {
    return jsonError(e);
  }
}

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const u = await getSessionUser();
    requireOrganizer(u);
    const body = await req.json();
    return ok(await createPlayer({ ...body, teamId: ctx.params.id }), 201);
  } catch (e) {
    return jsonError(e);
  }
}
