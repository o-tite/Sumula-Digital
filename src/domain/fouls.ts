// Contadores de falta (RF §11).
// - Por time, por período (zera a cada início de período)
// - Por jogador, por jogo (acumula)

import type { Id, TimelineEvent } from "@/shared/types";

export function countTeamFoulsInPeriod(
  events: TimelineEvent[],
  teamId: Id,
  period: number
): number {
  return events.filter(
    (e) => e.type === "falta" && e.teamId === teamId && e.period === period
  ).length;
}

export function countPlayerFoulsInMatch(
  events: TimelineEvent[],
  playerId: Id
): number {
  return events.filter((e) => e.type === "falta" && e.playerId === playerId).length;
}

export type TeamFoulVisualState = "neutro" | "alerta" | "tiro_livre";

export function teamFoulVisualState(count: number, limit: number): TeamFoulVisualState {
  if (count >= limit) return "tiro_livre";
  if (count === limit - 1) return "alerta";
  return "neutro";
}
