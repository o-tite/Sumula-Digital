import Link from "next/link";
import { auth } from "@/infrastructure/auth";
import { listMatchesForReferee } from "@/application/use-cases/matches";

export default async function SumulaIndex() {
  const session = await auth();
  const matches = await listMatchesForReferee(session!.user.id);
  return (
    <div className="p-4 max-w-md mx-auto space-y-3">
      <h1 className="text-xl font-bold mb-2">Meus jogos</h1>
      {matches.length === 0 && (
        <p className="text-muted text-sm">Nenhum jogo atribuído a você.</p>
      )}
      <ul className="space-y-2">
        {matches.map((m) => (
          <li
            key={m.id}
            className="bg-white border border-surface-100 rounded-lg p-3"
          >
            <Link href={`/sumula/${m.id}`} className="block">
              <div className="text-xs text-muted">
                {m.round.championship.name} · Rodada {m.round.number}
              </div>
              <div className="font-semibold">
                {m.homeTeam.name} × {m.awayTeam.name}
              </div>
              <div className="text-sm text-muted">
                {new Date(m.scheduledAt).toLocaleString("pt-BR")} · {m.status}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
