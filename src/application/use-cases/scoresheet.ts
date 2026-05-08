// Use cases da súmula (RF §6, §7, §8, §15).

import { prisma } from "@/infrastructure/db";
import {
  ForbiddenError,
  NotFoundError,
  StateError,
  ValidationError
} from "@/shared/errors";
import { bus } from "@/infrastructure/sse-bus";
import { channels } from "@/application/sse-channels";
import { regulationFromDb } from "@/application/use-cases/championship";
import { deriveScore } from "@/domain/score";
import { decideAfterLastPeriod } from "@/domain/scoresheet-state";
import { validateCanStartFirstPeriod, validateCanSaveScoresheet } from "@/domain/pre-game";
import { elapsedSeconds, formatClock } from "@/domain/clock";
import type {
  EventType,
  PresenceRecord as DomainPresence,
  TimelineEvent as DomainEvent
} from "@/shared/types";

interface SessionUser {
  id: string;
  role: "ORGANIZER" | "REFEREE";
}

async function loadMatchForReferee(matchId: string, user: SessionUser) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      round: { include: { championship: { include: { regulation: true } } } },
      scoresheet: {
        include: {
          presenceRecords: true,
          timelineEvents: { orderBy: { recordedAt: "asc" } }
        }
      }
    }
  });
  if (!match) throw new NotFoundError("Jogo não encontrado");
  if (user.role !== "REFEREE") throw new ForbiddenError("Apenas mesário");
  if (match.refereeUserId !== user.id) {
    throw new ForbiddenError("Você não está atribuído a este jogo");
  }
  if (!match.round.championship.regulation) {
    throw new StateError("Regulamento não configurado");
  }
  return match;
}

/**
 * Cria a súmula em estado pre_jogo. Idempotente: se já existir, retorna a existente.
 */
export async function getOrCreateScoresheet(matchId: string, user: SessionUser) {
  const match = await loadMatchForReferee(matchId, user);
  if (match.scoresheet) return match.scoresheet;

  // Cria scoresheet + presença inicial (todos ausentes)
  const teamPlayers = await prisma.player.findMany({
    where: {
      teamId: { in: [match.homeTeamId, match.awayTeamId] },
      status: { not: "inativo" }
    }
  });

  const ss = await prisma.scoresheet.create({
    data: {
      matchId,
      status: "em_andamento",
      uiState: "pre_jogo",
      presenceRecords: {
        create: teamPlayers.map((p) => ({
          playerId: p.id,
          present: false,
          jerseyNumber: null
        }))
      }
    },
    include: { presenceRecords: true, timelineEvents: true }
  });
  return ss;
}

export async function setPresence(input: {
  scoresheetId: string;
  playerId: string;
  present: boolean;
  jerseyNumber?: number | null;
  absenceType?: "justificada" | "injustificada" | null;
  user: SessionUser;
}) {
  const ss = await prisma.scoresheet.findUnique({
    where: { id: input.scoresheetId },
    include: { match: true }
  });
  if (!ss) throw new NotFoundError("Súmula não encontrada");
  if (ss.match.refereeUserId !== input.user.id) throw new ForbiddenError();
  if (ss.status === "salvo") throw new StateError("Súmula salva — peça reabertura ao organizador");

  // Unicidade de número de camisa por time neste jogo:
  // se vai marcar presente OU alterar número, garantir que ninguém do mesmo time
  // já está usando esse número.
  if (input.present && input.jerseyNumber !== undefined && input.jerseyNumber !== null) {
    const player = await prisma.player.findUnique({
      where: { id: input.playerId },
      select: { teamId: true }
    });
    if (!player) throw new NotFoundError("Jogador não encontrado");
    const sameTeamPlayerIds = (
      await prisma.player.findMany({
        where: { teamId: player.teamId },
        select: { id: true }
      })
    ).map((p) => p.id);
    const conflict = await prisma.presenceRecord.findFirst({
      where: {
        scoresheetId: ss.id,
        present: true,
        jerseyNumber: input.jerseyNumber,
        playerId: { in: sameTeamPlayerIds, not: input.playerId }
      },
      include: { player: { select: { fullName: true } } }
    });
    if (conflict) {
      throw new ValidationError(
        `Camisa #${input.jerseyNumber} já está com ${conflict.player.fullName} neste time.`
      );
    }
  }

  const record = await prisma.presenceRecord.upsert({
    where: { scoresheetId_playerId: { scoresheetId: ss.id, playerId: input.playerId } },
    update: {
      present: input.present,
      jerseyNumber:
        input.jerseyNumber !== undefined ? input.jerseyNumber : input.present ? undefined : null,
      absenceType: input.present ? null : input.absenceType ?? null
    },
    create: {
      scoresheetId: ss.id,
      playerId: input.playerId,
      present: input.present,
      jerseyNumber: input.jerseyNumber ?? null,
      absenceType: input.present ? null : input.absenceType ?? null
    }
  });
  return record;
}

export async function setInitialGoalkeeper(input: {
  scoresheetId: string;
  side: "home" | "away";
  playerId?: string;
  avulso?: { name: string; jersey: number };
  user: SessionUser;
}) {
  const ss = await prisma.scoresheet.findUnique({
    where: { id: input.scoresheetId },
    include: { match: true, presenceRecords: true }
  });
  if (!ss) throw new NotFoundError("Súmula não encontrada");
  if (ss.match.refereeUserId !== input.user.id) throw new ForbiddenError();

  if (input.playerId) {
    const present = ss.presenceRecords.find(
      (p) => p.playerId === input.playerId && p.present
    );
    if (!present) {
      throw new ValidationError("Goleiro deve estar marcado como presente");
    }
  }
  // Sem playerId e sem avulso → limpa goleiro do time (operação de desmarcação)

  const update =
    input.side === "home"
      ? {
          homeGoalkeeperPlayerId: input.playerId ?? null,
          homeGoalkeeperAvulsoName: input.avulso?.name ?? null,
          homeGoalkeeperAvulsoJersey: input.avulso?.jersey ?? null
        }
      : {
          awayGoalkeeperPlayerId: input.playerId ?? null,
          awayGoalkeeperAvulsoName: input.avulso?.name ?? null,
          awayGoalkeeperAvulsoJersey: input.avulso?.jersey ?? null
        };

  // Limpa tag de goleiro APENAS dos jogadores do mesmo time
  // (bug anterior limpava em ambos os times → não era possível ter goleiro nos dois)
  const sideTeamId =
    input.side === "home" ? ss.match.homeTeamId : ss.match.awayTeamId;
  const sideTeamPlayerIds = (
    await prisma.player.findMany({
      where: { teamId: sideTeamId },
      select: { id: true }
    })
  ).map((p) => p.id);
  await prisma.presenceRecord.updateMany({
    where: {
      scoresheetId: ss.id,
      isGoalkeeper: true,
      playerId: { in: sideTeamPlayerIds }
    },
    data: { isGoalkeeper: false }
  });
  if (input.playerId) {
    await prisma.presenceRecord.update({
      where: { scoresheetId_playerId: { scoresheetId: ss.id, playerId: input.playerId } },
      data: { isGoalkeeper: true }
    });
  }

  return prisma.scoresheet.update({ where: { id: ss.id }, data: update });
}

export async function startNextPeriod(input: { matchId: string; user: SessionUser }) {
  const match = await loadMatchForReferee(input.matchId, input.user);
  if (!match.scoresheet) {
    await getOrCreateScoresheet(input.matchId, input.user);
  }
  const fresh = await prisma.scoresheet.findUnique({
    where: { matchId: input.matchId },
    include: { presenceRecords: true, timelineEvents: true, match: true }
  });
  if (!fresh) throw new NotFoundError("Súmula não criada");

  const reg = match.round.championship.regulation!;
  if (fresh.uiState === "pre_jogo") {
    const presenceDomain: DomainPresence[] = fresh.presenceRecords.map((p) => ({
      scoresheetId: p.scoresheetId,
      playerId: p.playerId,
      jerseyNumber: p.jerseyNumber,
      present: p.present,
      absenceType: (p.absenceType as DomainPresence["absenceType"]) ?? null,
      isGoalkeeper: p.isGoalkeeper
    }));
    const v = validateCanStartFirstPeriod(presenceDomain);
    if (!v.canStart) throw new ValidationError(v.reason ?? "Início bloqueado");
  } else if (fresh.uiState !== "intervalo") {
    throw new StateError(`Não é possível iniciar período a partir do estado ${fresh.uiState}`);
  }

  const nextPeriod = fresh.currentPeriod + 1;
  if (nextPeriod > reg.numPeriods) {
    throw new StateError("Todos os períodos já foram jogados");
  }
  const startedAt = new Date();
  const updated = await prisma.scoresheet.update({
    where: { id: fresh.id },
    data: {
      uiState: "periodo_em_andamento",
      currentPeriod: nextPeriod,
      periodStartedAt: startedAt,
      startedAt: fresh.startedAt ?? startedAt,
      timelineEvents: {
        create: {
          type: "inicio_periodo",
          clockLabel: "00:00",
          teamId: match.homeTeamId,
          period: nextPeriod
        }
      }
    },
    include: { timelineEvents: true }
  });

  if (match.status === "agendado") {
    await prisma.match.update({ where: { id: match.id }, data: { status: "em_andamento" } });
  }

  bus.emit(channels.match(match.id), "match.status", {
    status: "em_andamento",
    period: nextPeriod,
    started_at: startedAt.toISOString()
  });

  return updated;
}

export async function endCurrentPeriod(input: { matchId: string; user: SessionUser }) {
  const match = await loadMatchForReferee(input.matchId, input.user);
  const ss = await prisma.scoresheet.findUnique({
    where: { matchId: input.matchId },
    include: { match: true, timelineEvents: true }
  });
  if (!ss) throw new NotFoundError("Súmula não encontrada");
  if (ss.uiState !== "periodo_em_andamento") {
    throw new StateError("Período não está em andamento");
  }
  if (!ss.periodStartedAt) throw new StateError("Período sem timestamp inicial");

  const elapsed = elapsedSeconds(ss.periodStartedAt);
  const clockLabel = formatClock(elapsed);
  const reg = match.round.championship.regulation!;
  const isLast = ss.currentPeriod >= reg.numPeriods;

  const score = deriveScore(
    ss.timelineEvents as unknown as DomainEvent[],
    match.homeTeamId,
    match.awayTeamId
  );

  let nextUi: string;
  if (isLast) {
    nextUi = decideAfterLastPeriod({
      homeScore: score.homeScore,
      awayScore: score.awayScore,
      penaltiesEnabled: reg.penaltiesEnabled
    });
  } else {
    nextUi = "intervalo";
  }

  const updated = await prisma.scoresheet.update({
    where: { id: ss.id },
    data: {
      uiState: nextUi,
      periodStartedAt: null,
      timelineEvents: {
        create: {
          type: "fim_periodo",
          clockLabel,
          teamId: match.homeTeamId,
          period: ss.currentPeriod
        }
      }
    },
    include: { timelineEvents: true }
  });

  // Garante PenaltyShoot se for para modal
  if (nextUi === "modal_penaltis") {
    await prisma.penaltyShoot.upsert({
      where: { scoresheetId: ss.id },
      update: {},
      create: { scoresheetId: ss.id }
    });
  }

  bus.emit(channels.match(match.id), "match.event", {
    type: "fim_periodo",
    clock_label: clockLabel,
    period: ss.currentPeriod,
    timestamp: new Date().toISOString()
  });

  return updated;
}

/**
 * Reabre o último período encerrado (RF §7.6).
 */
export async function reopenLastPeriod(input: { matchId: string; user: SessionUser }) {
  const match = await loadMatchForReferee(input.matchId, input.user);
  const ss = await prisma.scoresheet.findUnique({
    where: { matchId: input.matchId },
    include: { timelineEvents: { orderBy: { recordedAt: "desc" } } }
  });
  if (!ss) throw new NotFoundError("Súmula não encontrada");
  if (ss.uiState !== "intervalo" && ss.uiState !== "em_revisao" && ss.uiState !== "modal_penaltis") {
    throw new StateError("Reabertura só após encerrar um período");
  }
  const lastFimPeriodo = ss.timelineEvents.find((e) => e.type === "fim_periodo");
  if (!lastFimPeriodo) throw new StateError("Sem fim_periodo registrado");

  await prisma.timelineEvent.delete({ where: { id: lastFimPeriodo.id } });
  return prisma.scoresheet.update({
    where: { id: ss.id },
    data: {
      uiState: "periodo_em_andamento",
      periodStartedAt: new Date(Date.now() - parseClockToMs(lastFimPeriodo.clockLabel))
    }
  });
}

function parseClockToMs(label: string): number {
  const [mm, ss] = label.split(":").map(Number);
  return ((mm ?? 0) * 60 + (ss ?? 0)) * 1000;
}

/**
 * Salva a súmula (RF §15.4) — confirmação do mesário.
 */
export async function saveScoresheet(input: { matchId: string; user: SessionUser }) {
  const match = await loadMatchForReferee(input.matchId, input.user);
  const ss = await prisma.scoresheet.findUnique({
    where: { matchId: input.matchId },
    include: { timelineEvents: true }
  });
  if (!ss) throw new NotFoundError("Súmula não encontrada");
  if (ss.uiState !== "em_revisao" && ss.uiState !== "reaberto") {
    throw new StateError("Só é possível salvar a partir da revisão");
  }

  const v = validateCanSaveScoresheet({
    homeGoalkeeperPlayerId: ss.homeGoalkeeperPlayerId,
    homeGoalkeeperAvulsoName: ss.homeGoalkeeperAvulsoName,
    awayGoalkeeperPlayerId: ss.awayGoalkeeperPlayerId,
    awayGoalkeeperAvulsoName: ss.awayGoalkeeperAvulsoName
  });
  if (!v.canSave) throw new ValidationError(v.reason ?? "Goleiro obrigatório");

  const score = deriveScore(
    ss.timelineEvents as unknown as DomainEvent[],
    match.homeTeamId,
    match.awayTeamId
  );

  const now = new Date();
  const saved = await prisma.scoresheet.update({
    where: { id: ss.id },
    data: {
      status: "salvo",
      uiState: "encerrado",
      savedAt: now,
      finishedAt: now,
      homeScore: score.homeScore,
      awayScore: score.awayScore
    }
  });
  await prisma.match.update({
    where: { id: match.id },
    data: { status: "encerrado" }
  });

  bus.emit(channels.match(match.id), "match.saved", {
    match_id: match.id,
    home_score: score.homeScore,
    away_score: score.awayScore,
    saved_at: now.toISOString()
  });

  return saved;
}

/**
 * Cancela a súmula em andamento (RF §5.4 transição em_andamento → agendado).
 */
export async function cancelScoresheet(input: { matchId: string; user: SessionUser }) {
  const match = await loadMatchForReferee(input.matchId, input.user);
  const ss = await prisma.scoresheet.findUnique({ where: { matchId: input.matchId } });
  if (!ss) throw new NotFoundError("Súmula não encontrada");
  if (ss.status === "salvo") {
    throw new StateError("Súmula salva — apenas o organizador pode reabrir/editar");
  }
  await prisma.scoresheet.delete({ where: { id: ss.id } });
  await prisma.match.update({ where: { id: match.id }, data: { status: "agendado" } });
  return { matchId: match.id };
}

/**
 * Voltar de em_revisao para periodo_em_andamento (RF §15.2).
 */
export async function backToInPeriod(input: { matchId: string; user: SessionUser }) {
  const match = await loadMatchForReferee(input.matchId, input.user);
  const ss = await prisma.scoresheet.findUnique({ where: { matchId: input.matchId } });
  if (!ss || ss.uiState !== "em_revisao") throw new StateError("Não está em revisão");
  // Retoma o último período: precisa re-iniciar relógio do último período (sem novo evento).
  return prisma.scoresheet.update({
    where: { id: ss.id },
    data: { uiState: "periodo_em_andamento", periodStartedAt: new Date() }
  });
}
