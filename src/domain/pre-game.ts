// Validação pré-jogo (RF §6.5).
// Única regra de bloqueio: TODOS os jogadores marcados como `presente` devem ter `jersey_number` preenchido.
// Não bloqueiam: ausência de presentes, goleiro inicial não definido, responsáveis não preenchidos.

import type { PresenceRecord } from "@/shared/types";

export interface PreGameValidation {
  canStart: boolean;
  reason: string | null;
  blockedPlayerIds: string[];
}

export function validateCanStartFirstPeriod(
  presences: PresenceRecord[]
): PreGameValidation {
  const blocked = presences.filter(
    (p) => p.present && (p.jerseyNumber === null || Number.isNaN(p.jerseyNumber))
  );
  if (blocked.length > 0) {
    return {
      canStart: false,
      reason: "Há jogadores presentes sem número de camisa preenchido.",
      blockedPlayerIds: blocked.map((p) => p.playerId)
    };
  }
  return { canStart: true, reason: null, blockedPlayerIds: [] };
}

/**
 * RF §15.4: salvar súmula exige goleiro definido para cada time
 * (jogador cadastrado ou avulso).
 */
export function validateCanSaveScoresheet(args: {
  homeGoalkeeperPlayerId: string | null;
  homeGoalkeeperAvulsoName: string | null;
  awayGoalkeeperPlayerId: string | null;
  awayGoalkeeperAvulsoName: string | null;
}): { canSave: boolean; reason: string | null } {
  const homeOk = !!args.homeGoalkeeperPlayerId || !!args.homeGoalkeeperAvulsoName;
  const awayOk = !!args.awayGoalkeeperPlayerId || !!args.awayGoalkeeperAvulsoName;
  if (!homeOk || !awayOk) {
    return {
      canSave: false,
      reason: "Goleiro de cada time deve estar definido (cadastrado ou avulso)."
    };
  }
  return { canSave: true, reason: null };
}
