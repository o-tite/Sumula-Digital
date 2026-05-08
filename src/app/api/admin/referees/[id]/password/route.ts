import { NextRequest } from "next/server";
import { getSessionUser, jsonError, ok } from "@/app/api/_helpers";
import { requireOrganizer } from "@/application/guards";
import { resetRefereePassword } from "@/application/use-cases/referees";

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const u = await getSessionUser();
    requireOrganizer(u);
    const body = await req.json();
    await resetRefereePassword(ctx.params.id, body.password);
    return ok({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}
