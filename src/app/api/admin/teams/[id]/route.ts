import { NextRequest } from "next/server";
import { getSessionUser, jsonError, ok } from "@/app/api/_helpers";
import { requireOrganizer } from "@/application/guards";
import { deleteTeam, updateTeam } from "@/application/use-cases/teams";

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const u = await getSessionUser();
    requireOrganizer(u);
    const body = await req.json();
    return ok(await updateTeam(ctx.params.id, body));
  } catch (e) {
    return jsonError(e);
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const u = await getSessionUser();
    requireOrganizer(u);
    await deleteTeam(ctx.params.id);
    return ok({ deleted: true });
  } catch (e) {
    return jsonError(e);
  }
}
