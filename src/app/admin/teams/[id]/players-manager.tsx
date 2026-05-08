"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Player = {
  id: string;
  fullName: string;
  status: string;
};

export function PlayersManager({
  teamId,
  players
}: {
  teamId: string;
  players: Player[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/admin/teams/${teamId}/players`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: name })
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.message ?? "Erro");
      return;
    }
    setName("");
    router.refresh();
  }

  async function setStatus(id: string, status: string) {
    await fetch(`/api/admin/players/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {players.map((p) => (
          <li
            key={p.id}
            className="bg-white rounded-lg border border-surface-100 p-3 flex items-center justify-between"
          >
            <span>
              {p.fullName}{" "}
              <span
                className={`text-xs px-2 py-0.5 rounded ${
                  p.status === "ativo"
                    ? "bg-success/10 text-success"
                    : p.status === "suspenso"
                      ? "bg-danger/10 text-danger"
                      : "bg-surface-100 text-muted"
                }`}
              >
                {p.status}
              </span>
            </span>
            <select
              value={p.status}
              onChange={(e) => setStatus(p.id, e.target.value)}
              className="text-sm border border-surface-100 rounded px-2 py-1"
            >
              <option value="ativo">ativo</option>
              <option value="suspenso">suspenso</option>
              <option value="inativo">inativo</option>
            </select>
          </li>
        ))}
      </ul>

      <form
        onSubmit={add}
        className="flex gap-2 bg-white rounded-lg border border-surface-100 p-3"
      >
        <input
          required
          placeholder="Nome completo do jogador"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded border border-surface-100 px-3 py-2"
        />
        <button className="rounded bg-primary-500 text-white px-4 font-semibold">
          Adicionar
        </button>
      </form>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
