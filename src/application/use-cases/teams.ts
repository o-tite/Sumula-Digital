// Use cases de times (RF §3).

import { prisma } from "@/infrastructure/db";
import { NotFoundError, StateError, ValidationError } from "@/shared/errors";

const FORBIDDEN_TEAM_COLORS = new Set([
  "#E87722", // alerta laranja
  "#E24B4A", // erro vermelho
  "#00CC88" // sucesso verde
]);

function normalizeHex(value: string | null | undefined): string | null {
  if (!value) return null;
  const v = value.trim().toUpperCase();
  if (!/^#[0-9A-F]{6}$/.test(v)) {
    throw new ValidationError("Cor inválida — use formato #RRGGBB");
  }
  if (FORBIDDEN_TEAM_COLORS.has(v)) {
    throw new ValidationError(
      "Cores funcionais (laranja/vermelho/verde) não podem ser usadas como cor do time"
    );
  }
  return v;
}

export async function listTeams(championshipId: string) {
  return prisma.team.findMany({
    where: { championshipId },
    include: { _count: { select: { players: true } } },
    orderBy: { name: "asc" }
  });
}

export async function createTeam(input: {
  championshipId: string;
  name: string;
  color?: string | null;
  logoUrl?: string | null;
}) {
  if (!input.name?.trim()) throw new ValidationError("Nome é obrigatório");
  const champ = await prisma.championship.findUnique({
    where: { id: input.championshipId }
  });
  if (!champ) throw new NotFoundError("Campeonato não encontrado");

  return prisma.team.create({
    data: {
      championshipId: input.championshipId,
      name: input.name.trim(),
      color: normalizeHex(input.color),
      logoUrl: input.logoUrl ?? null
    }
  });
}

export async function updateTeam(
  id: string,
  input: { name?: string; color?: string | null; logoUrl?: string | null }
) {
  const team = await prisma.team.findUnique({ where: { id } });
  if (!team) throw new NotFoundError("Time não encontrado");

  return prisma.team.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.color !== undefined ? { color: normalizeHex(input.color) } : {}),
      ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl } : {})
    }
  });
}

export async function deleteTeam(id: string) {
  const matchCount = await prisma.match.count({
    where: { OR: [{ homeTeamId: id }, { awayTeamId: id }] }
  });
  if (matchCount > 0) {
    throw new StateError("Time possui jogos cadastrados — não pode ser excluído");
  }
  await prisma.team.delete({ where: { id } });
}
