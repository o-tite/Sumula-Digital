import { describe, it, expect } from "vitest";
import { computePenaltyState } from "@/domain/penalty";
import type { PenaltyKickRecord } from "@/shared/types";

const HOME = "h";
const AWAY = "a";

function kick(team: string, order: number, converted: boolean): PenaltyKickRecord {
  return {
    id: `k${order}-${team}`,
    penaltyShootId: "ps",
    teamId: team,
    playerId: "p" + order,
    kickOrder: order,
    converted
  };
}

describe("penalty shootout", () => {
  it("estado inicial: home começa, kick 1", () => {
    const s = computePenaltyState({
      kicks: [],
      homeTeamId: HOME,
      awayTeamId: AWAY,
      kicksPerTeam: 5
    });
    expect(s.nextTeamId).toBe(HOME);
    expect(s.nextKickOrder).toBe(1);
    expect(s.finished).toBe(false);
  });

  it("alterna entre home e away (TC-SUM-040, TC-SUM-041)", () => {
    const after1 = computePenaltyState({
      kicks: [kick(HOME, 1, true)],
      homeTeamId: HOME,
      awayTeamId: AWAY,
      kicksPerTeam: 5
    });
    expect(after1.nextTeamId).toBe(AWAY);
    expect(after1.homeScore).toBe(1);

    const after2 = computePenaltyState({
      kicks: [kick(HOME, 1, true), kick(AWAY, 2, false)],
      homeTeamId: HOME,
      awayTeamId: AWAY,
      kicksPerTeam: 5
    });
    expect(after2.nextTeamId).toBe(HOME);
    expect(after2.awayScore).toBe(0);
  });

  it("desfazer última cobrança (TC-SUM-044) — recalcula a partir da lista resultante", () => {
    const before = computePenaltyState({
      kicks: [kick(HOME, 1, true), kick(AWAY, 2, false), kick(HOME, 3, true)],
      homeTeamId: HOME,
      awayTeamId: AWAY,
      kicksPerTeam: 3
    });
    expect(before.homeScore).toBe(2);
    const after = computePenaltyState({
      kicks: [kick(HOME, 1, true), kick(AWAY, 2, false)],
      homeTeamId: HOME,
      awayTeamId: AWAY,
      kicksPerTeam: 3
    });
    expect(after.homeScore).toBe(1);
    expect(after.nextTeamId).toBe(HOME);
    expect(after.nextKickOrder).toBe(3);
  });

  it("declara vencedor quando ambos completam sequência (TC-SUM-045)", () => {
    const kicks = [
      kick(HOME, 1, true),
      kick(AWAY, 2, false),
      kick(HOME, 3, true),
      kick(AWAY, 4, false),
      kick(HOME, 5, false),
      kick(AWAY, 6, true)
    ];
    const s = computePenaltyState({
      kicks,
      homeTeamId: HOME,
      awayTeamId: AWAY,
      kicksPerTeam: 3
    });
    expect(s.homeScore).toBe(2);
    expect(s.awayScore).toBe(1);
    expect(s.finished).toBe(true);
    expect(s.winnerTeamId).toBe(HOME);
  });

  it("não finaliza com placar empatado", () => {
    const kicks = [
      kick(HOME, 1, true),
      kick(AWAY, 2, true),
      kick(HOME, 3, false),
      kick(AWAY, 4, false)
    ];
    const s = computePenaltyState({
      kicks,
      homeTeamId: HOME,
      awayTeamId: AWAY,
      kicksPerTeam: 2
    });
    expect(s.finished).toBe(false);
    expect(s.winnerTeamId).toBeNull();
  });
});
