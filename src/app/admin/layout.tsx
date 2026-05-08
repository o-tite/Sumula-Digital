import Link from "next/link";
import { auth, signOut } from "@/infrastructure/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ORGANIZER") redirect("/");

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="bg-ink text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="text-lg font-semibold">
            Saint Clair · Admin
          </Link>
          <nav className="flex gap-4 text-sm text-primary-200">
            <Link href="/admin">Campeonatos</Link>
            <Link href="/admin/referees">Mesários</Link>
          </nav>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button className="text-sm text-primary-200 hover:text-white">
            Sair · {session.user.name}
          </button>
        </form>
      </header>
      <main className="max-w-5xl mx-auto p-4">{children}</main>
    </div>
  );
}
