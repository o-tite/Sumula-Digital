import Link from "next/link";
import { listChampionships } from "@/application/use-cases/championship";
import { CreateChampionshipForm } from "./create-championship-form";

export default async function AdminHome() {
  const championships = await listChampionships();
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold mb-4">Campeonatos</h1>
        {championships.length === 0 && (
          <p className="text-muted mb-4">Nenhum campeonato criado ainda.</p>
        )}
        <ul className="space-y-2 mb-8">
          {championships.map((c) => (
            <li
              key={c.id}
              className="rounded-lg border border-surface-100 bg-white p-4 flex justify-between items-center"
            >
              <div>
                <div className="font-semibold text-ink">{c.name}</div>
                <div className="text-sm text-muted">
                  {c.modality} · {c.season} · {c.status}
                </div>
              </div>
              <Link
                href={`/admin/championships/${c.id}`}
                className="text-primary-500 font-medium"
              >
                Abrir →
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-surface-100 bg-white p-6">
        <h2 className="text-lg font-semibold mb-3">Novo campeonato</h2>
        <CreateChampionshipForm />
      </section>
    </div>
  );
}
