// Disputa de pênaltis (RF §14).
// - Sequência alternada (A1, B1, A2, B2, ...)
// - Cada cobrança convertida soma 1 ao placar do time cobrador
// - Disputa termina quando ambos os times completam `penaltyKicksPerTeam` cobranças
// - Vencedor é declarado apenas no fim de toda a sequência (regra simples MVP)
//
// Observação: a regra de morte súbita após empate nas cobranças regulamentares
// não está nos requisitos desta entrega — escopo MVP.

import type { Id, PenaltyKickRecord } from "@/shared/types";

export interface PenaltyState {
  homeScore: number;
  awayScore: number;
  totalKicks: number;
  homeKicks: number;
  awayKicks: number;
  nextTeamId: Id;
  nextKickOrder: number;
  finished: boolean;
  winnerTeamId: Id | null;
}

export function computePenaltyState(args: {
  kicks: PenaltyKickRecord[];
  homeTeamId: Id;
  awayTeamId: Id;
  kicksPerTeam: number;
}): PenaltyState {
  const { kicks, homeTeamId, awayTeamId, kicksPerTeam } = args;

  let homeScore = 0;
  let awayScore = 0;
  let homeKicks = 0;
  let awayKicks = 0;
  for (const k of kicks) {
    if (k.teamId === homeTeamId) {
      homeKicks += 1;
      if (k.converted) homeScore += 1;
    } else if (k.teamId === awayTeamId) {
      awayKicks += 1;
      if (k.converted) awayScore += 1;
    }
  }
  const totalKicks = kicks.length;

  // Sequência alternada: home começa (A1, B1, A2, B2, ...).
  // O próximo time é determinado pela paridade do total de cobranças.
  const nextTeamId = totalKicks % 2 === 0 ? homeTeamId : awayTeamId;
  const nextKickOrder = totalKicks + 1;

  const finished =
    homeKicks >= kicksPerTeam &&
    awayKicks >= kicksPerTeam &&
    homeScore !== awayScore;

  let winnerTeamId: Id | null = null;
  if (finished) {
    winnerTeamId = homeScore > awayScore ? homeTeamId : awayTeamId;
  }

  return {
    homeScore,
    awayScore,
    totalKicks,
    homeKicks,
    awayKicks,
    nextTeamId,
    nextKickOrder,
    finished,
    winnerTeamId
  };
}
