import { NextRequest } from "next/server";
import { getSessionUser, jsonError, ok } from "@/app/api/_helpers";
import { requireOrganizer } from "@/application/guards";
import { getChampionship } from "@/application/use-cases/championship";

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const u = await getSessionUser();
    requireOrganizer(u);
    return ok(await getChampionship(ctx.params.id));
  } catch (e) {
    return jsonError(e);
  }
}
