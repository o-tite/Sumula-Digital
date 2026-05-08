export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { getSessionUser, jsonError, ok } from "@/app/api/_helpers";
import { requireOrganizer } from "@/application/guards";
import {
  createChampionship,
  listChampionships
} from "@/application/use-cases/championship";

export async function GET() {
  try {
    const u = await getSessionUser();
    requireOrganizer(u);
    return ok(await listChampionships());
  } catch (e) {
    return jsonError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const u = await getSessionUser();
    requireOrganizer(u);
    const body = await req.json();
    return ok(await createChampionship(body), 201);
  } catch (e) {
    return jsonError(e);
  }
}
