import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/infrastructure/db";
import { listPlayers } from "@/application/use-cases/players";
import { PlayersManager } from "./players-manager";

export default async function TeamPage({ params }: { params: { id: string } }) {
  const team = await prisma.team.findUnique({ where: { id: params.id } });
  if (!team) notFound();
  const players = await listPlayers(params.id);
  return (
    <div className="space-y-4">
      <Link href={`/admin/championships/${team.championshipId}`} className="text-sm text-primary-500">
        ← Campeonato
      </Link>
      <h1 className="text-2xl font-bold">{team.name}</h1>
      <PlayersManager teamId={params.id} players={players} />
    </div>
  );
}
