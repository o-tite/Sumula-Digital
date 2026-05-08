import Link from "next/link";
import { auth } from "@/infrastructure/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    if (session.user.role === "ORGANIZER") redirect("/admin");
    if (session.user.role === "REFEREE") redirect("/sumula");
  }
  return (
    <main className="min-h-screen bg-gradient-to-b from-primary-700 to-ink p-8 text-white">
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-4xl font-bold mb-2">Saint Clair</h1>
        <p className="text-primary-50 mb-10">Eventos Esportivos · Súmula Digital</p>
        <Link
          href="/login"
          className="inline-block w-full rounded-lg bg-primary-500 px-6 py-4 text-lg font-semibold hover:bg-primary-700"
        >
          Entrar
        </Link>
        <p className="mt-8 text-sm text-primary-200">
          Acesso destinado a organizadores e mesários do campeonato.
        </p>
      </div>
    </main>
  );
}
