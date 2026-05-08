import { NextRequest } from "next/server";
import { getSessionUser, jsonError, ok } from "@/app/api/_helpers";
import { requireOrganizer } from "@/application/guards";
import { updateMatch } from "@/application/use-cases/matches";

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const u = await getSessionUser();
    requireOrganizer(u);
    const body = await req.json();
    if (body.scheduledAt) body.scheduledAt = new Date(body.scheduledAt);
    return ok(await updateMatch(ctx.params.id, body));
  } catch (e) {
    return jsonError(e);
  }
}
