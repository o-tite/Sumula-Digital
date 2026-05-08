import { NextRequest } from "next/server";
import { getSessionUser, jsonError, ok } from "@/app/api/_helpers";
import { requireOrganizer } from "@/application/guards";
import { updatePlayer } from "@/application/use-cases/players";

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const u = await getSessionUser();
    requireOrganizer(u);
    const body = await req.json();
    return ok(await updatePlayer(ctx.params.id, body));
  } catch (e) {
    return jsonError(e);
  }
}
