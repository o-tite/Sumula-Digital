// Regras de cartões (RF §10).
// - 2 amarelos no mesmo jogo geram cartão vermelho automático
// - Vermelho direto OU vermelho automático geram alerta de suspensão
// - Cartão azul só está disponível quando regulamento permite

import type { Id, SuspensionReason, TimelineEvent } from "@/shared/types";

export interface PlayerCardCount {
  yellow: number;
  red: number;
  blue: number;
}

export function countCardsForPlayer(
  events: TimelineEvent[],
  playerId: Id
): PlayerCardCount {
  let yellow = 0;
  let red = 0;
  let blue = 0;
  for (const e of events) {
    if (e.playerId !== playerId) continue;
    if (e.type === "cartao_amarelo") yellow += 1;
    else if (e.type === "cartao_vermelho") red += 1;
    else if (e.type === "cartao_azul") blue += 1;
  }
  return { yellow, red, blue };
}

export interface AutoRedDecision {
  shouldGenerate: boolean;
  reason: SuspensionReason | null;
}

/**
 * Regra: ao registrar 2º amarelo do MESMO jogador no MESMO jogo, sistema gera
 * vermelho automático. Já considera o evento que está sendo registrado.
 */
export function decideAutoRedOnYellow(
  existingEvents: TimelineEvent[],
  playerId: Id
): AutoRedDecision {
  const yellowsBefore = existingEvents.filter(
    (e) => e.type === "cartao_amarelo" && e.playerId === playerId
  ).length;
  // Já tinha 1 → este é o 2º → gera vermelho automático
  if (yellowsBefore >= 1) {
    return { shouldGenerate: true, reason: "dois_amarelos" };
  }
  return { shouldGenerate: false, reason: null };
}

/**
 * Verifica acúmulo de amarelos entre rodadas (verificado ao salvar a súmula).
 * Recebe a contagem total já consolidada do campeonato + amarelos deste jogo.
 */
export function shouldGenerateAccumulationSuspension(args: {
  yellowAccumulationLimit: number;
  previousYellowsAcrossChampionship: number;
  yellowsInCurrentMatch: number;
  alreadySuspendedFromMatch: boolean;
}): boolean {
  if (args.alreadySuspendedFromMatch) return false;
  const total = args.previousYellowsAcrossChampionship + args.yellowsInCurrentMatch;
  // Atinge ou ultrapassa o limite e ainda não foi suspenso por outro motivo
  return total >= args.yellowAccumulationLimit;
}
