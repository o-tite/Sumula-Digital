// Convenções de canais SSE — usadas pelos use cases para emitir eventos.

export const channels = {
  match: (matchId: string) => `match:${matchId}`,
  championship: (championshipId: string) => `championship:${championshipId}:tables`,
  orgAlerts: () => "org:alerts"
};
