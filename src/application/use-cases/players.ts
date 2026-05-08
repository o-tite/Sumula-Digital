// Use cases de jogadores (RF §4).

import { prisma } from "@/infrastructure/db";
import { NotFoundError, ValidationError } from "@/shared/errors";
import type { PlayerStatus } from "@/shared/types";

const VALID_STATUSES: PlayerStatus[] = ["ativo", "suspenso", "inativo"];

export async function listPlayers(teamId: string) {
  return prisma.player.findMany({
    where: { teamId },
    orderBy: { fullName: "asc" }
  });
}

export async function listPlayersByChampionship(championshipId: string) {
  return prisma.player.findMany({
    where: { team: { championshipId } },
    include: { team: true },
    orderBy: { fullName: "asc" }
  });
}

export async function createPlayer(input: { teamId: string; fullName: string }) {
  if (!input.fullName?.trim()) throw new ValidationError("Nome é obrigatório");
  const team = await prisma.team.findUnique({ where: { id: input.teamId } });
  if (!team) throw new NotFoundError("Time não encontrado");
  return prisma.player.create({
    data: {
      teamId: input.teamId,
      fullName: input.fullName.trim(),
      status: "ativo"
    }
  });
}

export async function updatePlayer(
  id: string,
  input: { fullName?: string; teamId?: string; status?: PlayerStatus }
) {
  const player = await prisma.player.findUnique({ where: { id } });
  if (!player) throw new NotFoundError("Jogador não encontrado");

  if (input.status && !VALID_STATUSES.includes(input.status)) {
    throw new ValidationError("Status inválido");
  }
  if (input.teamId) {
    const target = await prisma.team.findUnique({ where: { id: input.teamId } });
    if (!target) throw new NotFoundError("Time alvo não encontrado");
    // RF §4.2: jogador pertence a um único time. Mover sai do anterior automaticamente
    // pois `teamId` é único FK; presence_record histórico mantém time original.
  }

  return prisma.player.update({
    where: { id },
    data: {
      ...(input.fullName ? { fullName: input.fullName.trim() } : {}),
      ...(input.teamId ? { teamId: input.teamId } : {}),
      ...(input.status ? { status: input.status } : {})
    }
  });
}

/**
 * Último número de camisa registrado para o jogador no campeonato (RF §4.4 / §6.3).
 */
export async function lastJerseyNumberForPlayer(
  championshipId: string,
  playerId: string
): Promise<number | null> {
  const last = await prisma.presenceRecord.findFirst({
    where: {
      playerId,
      jerseyNumber: { not: null },
      scoresheet: {
        match: {
          round: { championshipId }
        }
      }
    },
    orderBy: { scoresheet: { createdAt: "desc" } }
  });
  return last?.jerseyNumber ?? null;
}
