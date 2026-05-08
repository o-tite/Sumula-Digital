"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const callback = sp.get("callbackUrl");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false
    });
    setLoading(false);
    if (!res || res.error) {
      // RF §1.1: erro genérico, sem detalhar campo
      setError("Credenciais inválidas.");
      return;
    }
    router.push(callback ?? "/");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-surface-50 p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow"
      >
        <h1 className="text-2xl font-bold text-primary-700 mb-1">Entrar</h1>
        <p className="text-sm text-muted mb-6">Saint Clair · Eventos Esportivos</p>

        <label className="block text-sm font-medium mb-1" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-lg border border-surface-100 bg-white px-3 py-3 text-base focus:border-primary-500 focus:outline-none"
          autoComplete="email"
        />

        <label className="block text-sm font-medium mb-1" htmlFor="password">
          Senha
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-2 w-full rounded-lg border border-surface-100 bg-white px-3 py-3 text-base focus:border-primary-500 focus:outline-none"
          autoComplete="current-password"
        />

        {error && (
          <p
            role="alert"
            className="my-3 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full rounded-lg bg-primary-500 px-4 py-3 text-base font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
