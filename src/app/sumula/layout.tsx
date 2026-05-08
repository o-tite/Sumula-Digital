import { auth, signOut } from "@/infrastructure/auth";
import { redirect } from "next/navigation";

export default async function SumulaLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "REFEREE") redirect("/");

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="bg-ink text-white px-4 py-3 flex items-center justify-between">
        <div className="text-sm font-semibold">Saint Clair · Mesário</div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button className="text-xs text-primary-200">{session.user.name} · sair</button>
        </form>
      </header>
      <main>{children}</main>
    </div>
  );
}
