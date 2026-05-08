export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { getSessionUser, jsonError, ok } from "@/app/api/_helpers";
import { requireReferee } from "@/application/guards";
import { listMatchesForReferee } from "@/application/use-cases/matches";

export async function GET() {
  try {
    const u = await getSessionUser();
    requireReferee(u);
    return ok(await listMatchesForReferee(u.id));
  } catch (e) {
    return jsonError(e);
  }
}
