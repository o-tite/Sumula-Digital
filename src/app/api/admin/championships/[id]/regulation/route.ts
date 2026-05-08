import { NextRequest } from "next/server";
import { getSessionUser, jsonError, ok } from "@/app/api/_helpers";
import { requireOrganizer } from "@/application/guards";
import { upsertRegulation } from "@/application/use-cases/championship";

export async function PUT(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const u = await getSessionUser();
    requireOrganizer(u);
    const body = await req.json();
    return ok(await upsertRegulation(ctx.params.id, body));
  } catch (e) {
    return jsonError(e);
  }
}
