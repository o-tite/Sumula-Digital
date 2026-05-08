import { describe, it, expect } from "vitest";
import {
  validateCanStartFirstPeriod,
  validateCanSaveScoresheet
} from "@/domain/pre-game";

describe("pre-game validation", () => {
  it("bloqueia início se há presente sem camisa (TC-SUM-001)", () => {
    const r = validateCanStartFirstPeriod([
      {
        scoresheetId: "ss",
        playerId: "p1",
        jerseyNumber: null,
        present: true,
        absenceType: null,
        isGoalkeeper: false
      }
    ]);
    expect(r.canStart).toBe(false);
    expect(r.blockedPlayerIds).toEqual(["p1"]);
  });

  it("permite início quando todos os presentes têm camisa (TC-SUM-002)", () => {
    const r = validateCanStartFirstPeriod([
      {
        scoresheetId: "ss",
        playerId: "p1",
        jerseyNumber: 9,
        present: true,
        absenceType: null,
        isGoalkeeper: false
      },
      {
        scoresheetId: "ss",
        playerId: "p2",
        jerseyNumber: null,
        present: false,
        absenceType: null,
        isGoalkeeper: false
      }
    ]);
    expect(r.canStart).toBe(true);
  });

  it("permite início mesmo sem nenhum presente (TC-SUM-003)", () => {
    expect(validateCanStartFirstPeriod([]).canStart).toBe(true);
  });

  it("salvar exige goleiro de cada time (TC-SUM-030)", () => {
    expect(
      validateCanSaveScoresheet({
        homeGoalkeeperPlayerId: null,
        homeGoalkeeperAvulsoName: null,
        awayGoalkeeperPlayerId: "g2",
        awayGoalkeeperAvulsoName: null
      }).canSave
    ).toBe(false);

    expect(
      validateCanSaveScoresheet({
        homeGoalkeeperPlayerId: "g1",
        homeGoalkeeperAvulsoName: null,
        awayGoalkeeperPlayerId: null,
        awayGoalkeeperAvulsoName: "Avulso"
      }).canSave
    ).toBe(true);
  });
});
