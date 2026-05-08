import Link from "next/link";
import { notFound } from "next/navigation";
import { getChampionship } from "@/application/use-cases/championship";
import { listTeams } from "@/application/use-cases/teams";
import { listRounds } from "@/application/use-cases/rounds";
import { ChampionshipManager } from "./manager";

export default async function ChampionshipPage({
  params
}: {
  params: { id: string };
}) {
  let championship;
  try {
    championship = await getChampionship(params.id);
  } catch {
    notFound();
  }
  const teams = await listTeams(params.id);
  const rounds = await listRounds(params.id);
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-primary-500 text-sm">
          ← Campeonatos
        </Link>
        <h1 className="text-2xl font-bold mt-1">{championship.name}</h1>
        <p className="text-muted text-sm">
          {championship.modality} · {championship.season}
        </p>
      </div>
      <ChampionshipManager
        championship={championship as never}
        teams={teams as never}
        rounds={rounds as never}
      />
    </div>
  );
}
