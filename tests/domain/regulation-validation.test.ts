import { describe, it, expect } from "vitest";
import { validateRegulation } from "@/domain/regulation-validation";
import { ValidationError } from "@/shared/errors";
import type { RegulationData } from "@/shared/types";

const base: RegulationData = {
  numPeriods: 2,
  periodDurationMin: 20,
  intervalDurationMin: 5,
  cardTypes: "amarelo_vermelho",
  cardBlueMode: null,
  cardBlueDurationMin: null,
  yellowAccumulationLimit: 3,
  foulFreeKickEnabled: false,
  foulFreeKickLimit: 5,
  foulIndividualEnabled: false,
  foulIndividualLimit: null,
  penaltiesEnabled: false,
  penaltyKicksPerTeam: 5,
  pointsPenaltyWin: 2,
  pointsPenaltyLoss: 1,
  pointsWin: 3,
  pointsDraw: 1,
  pointsLoss: 0,
  tiebreakOrder: ["confronto_direto", "saldo_gols"],
  goalkeeperRankingFormula: "media"
};

describe("regulation validation", () => {
  it("aceita regulamento padrão", () => {
    expect(() => validateRegulation(base)).not.toThrow();
  });

  it("exige cardBlueMode quando cardTypes=com_azul", () => {
    expect(() =>
      validateRegulation({ ...base, cardTypes: "com_azul", cardBlueMode: null })
    ).toThrow(ValidationError);
  });

  it("exige cardBlueDurationMin quando cardBlueMode=temporario", () => {
    expect(() =>
      validateRegulation({
        ...base,
        cardTypes: "com_azul",
        cardBlueMode: "temporario",
        cardBlueDurationMin: null
      })
    ).toThrow(ValidationError);
  });

  it("aceita cardBlueMode definitivo_sub sem duração", () => {
    expect(() =>
      validateRegulation({
        ...base,
        cardTypes: "com_azul",
        cardBlueMode: "definitivo_sub",
        cardBlueDurationMin: null
      })
    ).not.toThrow();
  });

  it("exige foulIndividualLimit quando foulIndividualEnabled=true", () => {
    expect(() =>
      validateRegulation({ ...base, foulIndividualEnabled: true, foulIndividualLimit: null })
    ).toThrow(ValidationError);
  });

  it("exige tiebreakOrder não vazio", () => {
    expect(() => validateRegulation({ ...base, tiebreakOrder: [] })).toThrow(
      ValidationError
    );
  });
});
