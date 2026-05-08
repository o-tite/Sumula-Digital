// Tempo jogado por cada goleiro em um jogo (RF §12.4).
// - Goleiro inicial: de 00:00 até a 1ª troca, ou até fim do período
// - Trocas registradas via evento `troca_goleiro` com clock_label e period

import { parseClock } from "@/domain/clock";
import type { Id, TimelineEvent } from "@/shared/types";

export interface GoalkeeperSegment {
  playerId: Id;
  teamId: Id;
  startSeconds: number; // segundos absolutos desde 00:00 do período
  endSeconds: number;
  period: number;
}

export interface GoalkeeperTime {
  playerId: Id;
  totalSeconds: number;
}

/**
 * Calcula tempo total que cada goleiro de um time atuou ao longo do jogo.
 * Recebe duração final de cada período em segundos (último evento `fim_periodo` ou periodDurationMin*60).
 */
export function computeGoalkeeperTimeForTeam(args: {
  teamId: Id;
  initialGoalkeeperPlayerId: Id | null;
  events: TimelineEvent[];
  periodEndSecondsByPeriod: Record<number, number>;
}): GoalkeeperTime[] {
  const { teamId, initialGoalkeeperPlayerId, events, periodEndSecondsByPeriod } = args;

  const segments: GoalkeeperSegment[] = [];
  const periods = Object.keys(periodEndSecondsByPeriod)
    .map(Number)
    .sort((a, b) => a - b);

  let currentGoalkeeper: Id | null = initialGoalkeeperPlayerId;

  for (const period of periods) {
    const periodEnd = periodEndSecondsByPeriod[period] ?? 0;
    const swaps = events
      .filter((e) => e.type === "troca_goleiro" && e.teamId === teamId && e.period === period && e.playerId)
      .sort((a, b) => parseClock(a.clockLabel) - parseClock(b.clockLabel));

    let cursor = 0;
    for (const swap of swaps) {
      const swapSec = parseClock(swap.clockLabel);
      if (currentGoalkeeper) {
        segments.push({
          playerId: currentGoalkeeper,
          teamId,
          startSeconds: cursor,
          endSeconds: swapSec,
          period
        });
      }
      currentGoalkeeper = swap.playerId ?? null;
      cursor = swapSec;
    }
    if (currentGoalkeeper) {
      segments.push({
        playerId: currentGoalkeeper,
        teamId,
        startSeconds: cursor,
        endSeconds: periodEnd,
        period
      });
    }
  }

  const totals = new Map<Id, number>();
  for (const seg of segments) {
    const dur = Math.max(0, seg.endSeconds - seg.startSeconds);
    totals.set(seg.playerId, (totals.get(seg.playerId) ?? 0) + dur);
  }
  return Array.from(totals.entries()).map(([playerId, totalSeconds]) => ({
    playerId,
    totalSeconds
  }));
}
