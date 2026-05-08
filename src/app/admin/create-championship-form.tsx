"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateChampionshipForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [modality, setModality] = useState("futsal");
  const [season, setSeason] = useState(new Date().getFullYear().toString());
  const [seriesName, setSeriesName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/championships", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, modality, season, seriesName: seriesName || undefined })
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.message ?? "Erro ao criar");
      return;
    }
    setName("");
    setSeriesName("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
      <input
        required
        placeholder="Nome do campeonato"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded border border-surface-100 px-3 py-2"
      />
      <input
        required
        placeholder="Temporada (ex: 2026)"
        value={season}
        onChange={(e) => setSeason(e.target.value)}
        className="rounded border border-surface-100 px-3 py-2"
      />
      <select
        value={modality}
        onChange={(e) => setModality(e.target.value)}
        className="rounded border border-surface-100 px-3 py-2"
      >
        <option value="futsal">Futsal</option>
        <option value="suico">Suíço</option>
        <option value="campo">Campo</option>
      </select>
      <input
        placeholder="Série (opcional)"
        value={seriesName}
        onChange={(e) => setSeriesName(e.target.value)}
        className="rounded border border-surface-100 px-3 py-2"
      />
      {error && (
        <p className="md:col-span-2 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      <button
        disabled={loading}
        className="md:col-span-2 rounded bg-primary-500 text-white py-3 font-semibold disabled:opacity-50"
      >
        {loading ? "Criando…" : "Criar campeonato"}
      </button>
    </form>
  );
}
