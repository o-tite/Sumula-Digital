import { NextResponse } from "next/server";
import { auth } from "@/infrastructure/auth";
import { DomainError } from "@/shared/errors";
import type { UserRole } from "@/shared/types";

// Re-exporta convenção: rotas que usam auth() devem ser dinâmicas.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function getSessionUser() {
  const session = await auth();
  if (!session?.user) return null;
  return {
    id: session.user.id,
    role: session.user.role as UserRole,
    email: session.user.email,
    name: session.user.name
  };
}

export function jsonError(err: unknown) {
  if (err instanceof DomainError) {
    return NextResponse.json(
      { error: err.code, message: err.message, ...("issues" in err ? { issues: (err as { issues?: unknown }).issues } : {}) },
      { status: err.status }
    );
  }
  console.error(err);
  return NextResponse.json(
    { error: "INTERNAL", message: "Erro interno" },
    { status: 500 }
  );
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}
