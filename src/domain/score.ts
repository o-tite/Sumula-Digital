// Derivação de placar a partir da timeline.
// RF §9.3 + Arquitetura §6: timeline é fonte de verdade; placar nunca é campo independente.

import type { Id, TimelineEvent } from "@/shared/types";

export interface DerivedScore {
  homeScore: number;
  awayScore: number;
}

export function deriveScore(
  events: TimelineEvent[],
  homeTeamId: Id,
  awayTeamId: Id
): DerivedScore {
  let home = 0;
  let away = 0;

  for (const e of events) {
    if (e.type === "gol") {
      if (e.teamId === homeTeamId) home += 1;
      else if (e.teamId === awayTeamId) away += 1;
    } else if (e.type === "gol_contra") {
      // Gol contra: ponto vai para o ADVERSÁRIO ao team_id do evento.
      if (e.teamId === homeTeamId) away += 1;
      else if (e.teamId === awayTeamId) home += 1;
    }
  }

  return { homeScore: home, awayScore: away };
}
