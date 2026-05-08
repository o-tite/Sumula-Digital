// Use cases de jogos (RF §5).

import { prisma } from "@/infrastructure/db";
import {
  ForbiddenError,
  NotFoundError,
  StateError,
  ValidationError
} from "@/shared/errors";
import type { MatchStatus, UserRole } from "@/shared/types";
import { bus } from "@/infrastructure/sse-bus";
import { channels } from "@/application/sse-channels";

export async function createMatch(input: {
  roundId: string;
  homeTeamId: string;
  awayTeamId: string;
  refereeUserId?: string;
  refereeNameText?: string;
  homeResponsible?: string;
  awayResponsible?: string;
  scheduledAt: Date;
  venue?: string;
}) {
  if (input.homeTeamId === input.awayTeamId) {
    throw new ValidationError("Um time não pode jogar contra si mesmo");
  }
  const round = await prisma.round.findUnique({
    where: { id: input.roundId },
    include: { championship: true }
  });
  if (!round) throw new NotFoundError("Rodada não encontrada");

  const teams = await prisma.team.findMany({
    where: { id: { in: [input.homeTeamId, input.awayTeamId] } }
  });
  if (teams.length !== 2 || teams.some((t) => t.championshipId !== round.championshipId)) {
    throw new ValidationError("Times devem ser do mesmo campeonato");
  }

  if (input.refereeUserId) {
    const ref = await prisma.user.findUnique({ where: { id: input.refereeUserId } });
    if (!ref || ref.role !== "REFEREE") {
      throw new ValidationError("refereeUserId inválido");
    }
  }

  return prisma.match.create({
    data: {
      roundId: input.roundId,
      homeTeamId: input.homeTeamId,
      awayTeamId: input.awayTeamId,
      refereeUserId: input.refereeUserId ?? null,
      refereeNameText: input.refereeNameText?.trim() || null,
      homeResponsible: input.homeResponsible?.trim() || null,
      awayResponsible: input.awayResponsible?.trim() || null,
      scheduledAt: input.scheduledAt,
      venue: input.venue?.trim() || null,
      status: "agendado"
    }
  });
}

export async function updateMatch(
  id: string,
  input: Partial<{
    refereeUserId: string | null;
    refereeNameText: string | null;
    homeResponsible: string | null;
    awayResponsible: string | null;
    scheduledAt: Date;
    venue: string | null;
  }>
) {
  const match = await prisma.match.findUnique({ where: { id } });
  if (!match) throw new NotFoundError("Jogo não encontrado");

  // RF §5.5: reatribuição de mesário só permitida em status agendado
  if (input.refereeUserId !== undefined && match.status !== "agendado") {
    throw new StateError("Reatribuição de mesário só é possível com jogo agendado");
  }

  return prisma.match.update({
    where: { id },
    data: input
  });
}

export async function listMatchesForReferee(refereeId: string) {
  return prisma.match.findMany({
    where: { refereeUserId: refereeId },
    include: {
      homeTeam: true,
      awayTeam: true,
      round: { include: { championship: true } },
      scoresheet: { select: { id: true, status: true, uiState: true } }
    },
    orderBy: { scheduledAt: "asc" }
  });
}

export async function getMatchForReferee(matchId: string, refereeId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: { include: { players: true } },
      awayTeam: { include: { players: true } },
      round: { include: { championship: { include: { regulation: true } } } },
      scoresheet: {
        include: {
          presenceRecords: true,
          timelineEvents: { orderBy: { recordedAt: "asc" } },
          penaltyShoot: { include: { kicks: { orderBy: { kickOrder: "asc" } } } },
          occurrences: true
        }
      },
      refereeUser: true
    }
  });
  if (!match) throw new NotFoundError("Jogo não encontrado");
  if (match.refereeUserId !== refereeId) {
    throw new ForbiddenError("Você não está atribuído a este jogo");
  }
  return match;
}

export async function transitionMatchStatus(matchId: string, status: MatchStatus) {
  const match = await prisma.match.update({
    where: { id: matchId },
    data: { status }
  });
  bus.emit(channels.match(matchId), "match.status", {
    status: match.status,
    started_at: match.updatedAt
  });
  return match;
}

export function assertCanOperate(matchRefereeId: string | null, user: { id: string; role: UserRole }) {
  if (user.role !== "REFEREE") throw new ForbiddenError("Apenas mesário opera súmula");
  if (matchRefereeId !== user.id) throw new ForbiddenError("Você não está atribuído a este jogo");
}
