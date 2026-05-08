// Pênaltis (RF §14)

import { prisma } from "@/infrastructure/db";
import {
  ForbiddenError,
  NotFoundError,
  StateError,
  ValidationError
} from "@/shared/errors";
import { bus } from "@/infrastructure/sse-bus";
import { channels } from "@/application/sse-channels";
import { computePenaltyState } from "@/domain/penalty";
import type { PenaltyKickRecord } from "@/shared/types";

interface SessionUser {
  id: string;
  role: "ORGANIZER" | "REFEREE";
}

async function loadShoot(matchId: string, user: SessionUser) {
  const ss = await prisma.scoresheet.findUnique({
    where: { matchId },
    include: {
      match: { include: { round: { include: { championship: { include: { regulation: true } } } } } },
      penaltyShoot: { include: { kicks: { orderBy: { kickOrder: "asc" } } } },
      presenceRecords: true
    }
  });
  if (!ss) throw new NotFoundError("Súmula não encontrada");
  if (ss.match.refereeUserId !== user.id) throw new ForbiddenError();
  if (ss.uiState !== "modal_penaltis") {
    throw new StateError("Disputa de pênaltis não está em andamento");
  }
  if (!ss.penaltyShoot) throw new NotFoundError("Penalty shoot não inicializado");
  return ss;
}

export async function recordPenaltyKick(input: {
  matchId: string;
  user: SessionUser;
  teamId: string;
  playerId: string;
  converted: boolean;
}) {
  const ss = await loadShoot(input.matchId, input.user);
  const reg = ss.match.round.championship.regulation!;
  const homeId = ss.match.homeTeamId;
  const awayId = ss.match.awayTeamId;

  if (input.teamId !== homeId && input.teamId !== awayId) {
    throw new ValidationError("Time inválido para a disputa");
  }
  const presence = ss.presenceRecords.find((p) => p.playerId === input.playerId);
  if (!presence?.present) {
    throw new ValidationError("Cobrador deve estar marcado como presente");
  }

  const kicks = ss.penaltyShoot!.kicks as unknown as PenaltyKickRecord[];
  const state = computePenaltyState({
    kicks,
    homeTeamId: homeId,
    awayTeamId: awayId,
    kicksPerTeam: reg.penaltyKicksPerTeam
  });
  if (state.finished) throw new StateError("Disputa já encerrada");
  if (input.teamId !== state.nextTeamId) {
    throw new ValidationError("Não é a vez deste time cobrar");
  }

  const created = await prisma.penaltyKick.create({
    data: {
      penaltyShootId: ss.penaltyShoot!.id,
      teamId: input.teamId,
      playerId: input.playerId,
      kickOrder: state.nextKickOrder,
      converted: input.converted
    }
  });

  // Recalcula e atualiza shoot
  const after = computePenaltyState({
    kicks: [...kicks, created] as unknown as PenaltyKickRecord[],
    homeTeamId: homeId,
    awayTeamId: awayId,
    kicksPerTeam: reg.penaltyKicksPerTeam
  });
  await prisma.penaltyShoot.update({
    where: { id: ss.penaltyShoot!.id },
    data: {
      homeScore: after.homeScore,
      awayScore: after.awayScore,
      finished: after.finished
    }
  });

  bus.emit(channels.match(input.matchId), "match.penalty", {
    kick_order: created.kickOrder,
    team_id: created.teamId,
    converted: created.converted,
    home_total: after.homeScore,
    away_total: after.awayScore
  });

  return { kick: created, state: after };
}

export async function undoLastPenaltyKick(input: { matchId: string; user: SessionUser }) {
  const ss = await loadShoot(input.matchId, input.user);
  const last = ss.penaltyShoot!.kicks.at(-1);
  if (!last) throw new StateError("Nenhuma cobrança para desfazer");
  await prisma.penaltyKick.delete({ where: { id: last.id } });

  const remaining = ss.penaltyShoot!.kicks.slice(0, -1) as unknown as PenaltyKickRecord[];
  const after = computePenaltyState({
    kicks: remaining,
    homeTeamId: ss.match.homeTeamId,
    awayTeamId: ss.match.awayTeamId,
    kicksPerTeam: ss.match.round.championship.regulation!.penaltyKicksPerTeam
  });
  await prisma.penaltyShoot.update({
    where: { id: ss.penaltyShoot!.id },
    data: { homeScore: after.homeScore, awayScore: after.awayScore, finished: after.finished }
  });
  return { state: after };
}

export async function confirmPenaltyResult(input: { matchId: string; user: SessionUser }) {
  const ss = await loadShoot(input.matchId, input.user);
  const reg = ss.match.round.championship.regulation!;
  const state = computePenaltyState({
    kicks: ss.penaltyShoot!.kicks as unknown as PenaltyKickRecord[],
    homeTeamId: ss.match.homeTeamId,
    awayTeamId: ss.match.awayTeamId,
    kicksPerTeam: reg.penaltyKicksPerTeam
  });
  if (!state.finished) {
    throw new StateError("Disputa ainda não tem vencedor — registre as cobranças restantes");
  }
  return prisma.scoresheet.update({
    where: { id: ss.id },
    data: { uiState: "em_revisao" }
  });
}
