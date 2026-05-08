"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Referee = {
  id: string;
  email: string;
  name: string;
};

export function RefereesManager({ initial }: { initial: Referee[] }) {
  const router = useRouter();
  const [list, setList] = useState(initial);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetFor, setResetFor] = useState<string | null>(null);
  const [resetPwd, setResetPwd] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const r = await fetch("/api/admin/referees").then((r) => r.json());
    setList(r);
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/referees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.message ?? "Erro");
      return;
    }
    setName("");
    setEmail("");
    setPassword("");
    refresh();
    router.refresh();
  }

  async function reset(id: string) {
    if (!resetPwd) return;
    const res = await fetch(`/api/admin/referees/${id}/password`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: resetPwd })
    });
    if (res.ok) {
      setResetFor(null);
      setResetPwd("");
    } else {
      const j = await res.json().catch(() => ({}));
      setError(j.message ?? "Erro");
    }
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {list.map((u) => (
          <li
            key={u.id}
            className="bg-white border border-surface-100 rounded-lg p-3"
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">{u.name}</div>
                <div className="text-sm text-muted">{u.email}</div>
              </div>
              <button
                onClick={() => setResetFor(resetFor === u.id ? null : u.id)}
                className="text-primary-500 text-sm font-medium"
              >
                Redefinir senha
              </button>
            </div>
            {resetFor === u.id && (
              <div className="mt-3 flex gap-2">
                <input
                  type="password"
                  placeholder="Nova senha"
                  value={resetPwd}
                  onChange={(e) => setResetPwd(e.target.value)}
                  className="flex-1 rounded border border-surface-100 px-3 py-2"
                />
                <button
                  onClick={() => reset(u.id)}
                  className="rounded bg-primary-500 text-white px-4 font-semibold"
                >
                  Confirmar
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      <form
        onSubmit={create}
        className="bg-white rounded-lg border border-surface-100 p-4 grid gap-3 md:grid-cols-3"
      >
        <h2 className="md:col-span-3 font-semibold">Criar mesário</h2>
        <input
          required
          placeholder="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded border border-surface-100 px-3 py-2"
        />
        <input
          required
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded border border-surface-100 px-3 py-2"
        />
        <input
          required
          type="password"
          placeholder="Senha (mín. 6)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded border border-surface-100 px-3 py-2"
        />
        {error && <p className="md:col-span-3 text-sm text-danger">{error}</p>}
        <button className="md:col-span-3 rounded bg-primary-500 text-white py-3 font-semibold">
          Criar
        </button>
      </form>
    </div>
  );
}
