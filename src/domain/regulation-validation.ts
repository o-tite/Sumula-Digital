// Validação do regulamento (RF §2.2).
// Regras condicionais entre campos:
// - card_blue_mode obrigatório se card_types = com_azul
// - card_blue_duration_min obrigatório se card_blue_mode = temporario
// - foul_individual_limit obrigatório se foul_individual_enabled = true
// - penalty_kicks_per_team obrigatório se penalties_enabled = true
// - tiebreak_order não pode ser vazio

import { ValidationError } from "@/shared/errors";
import type { RegulationData } from "@/shared/types";

export function validateRegulation(data: RegulationData): void {
  const issues: { path: string; message: string }[] = [];

  if (data.numPeriods < 1) {
    issues.push({ path: "numPeriods", message: "Deve ser ≥ 1" });
  }
  if (data.periodDurationMin < 1) {
    issues.push({ path: "periodDurationMin", message: "Deve ser ≥ 1" });
  }

  if (data.cardTypes === "com_azul") {
    if (!data.cardBlueMode) {
      issues.push({
        path: "cardBlueMode",
        message: "Obrigatório quando cardTypes = com_azul"
      });
    } else if (
      data.cardBlueMode === "temporario" &&
      (data.cardBlueDurationMin === null || data.cardBlueDurationMin === undefined)
    ) {
      issues.push({
        path: "cardBlueDurationMin",
        message: "Obrigatório quando cardBlueMode = temporario"
      });
    }
  }

  if (data.foulIndividualEnabled && !data.foulIndividualLimit) {
    issues.push({
      path: "foulIndividualLimit",
      message: "Obrigatório quando punição individual habilitada"
    });
  }

  if (data.penaltiesEnabled && data.penaltyKicksPerTeam < 1) {
    issues.push({
      path: "penaltyKicksPerTeam",
      message: "Obrigatório (≥1) quando pênaltis habilitados"
    });
  }

  if (!data.tiebreakOrder || data.tiebreakOrder.length === 0) {
    issues.push({
      path: "tiebreakOrder",
      message: "Deve conter ao menos um critério"
    });
  }

  if (data.yellowAccumulationLimit < 1) {
    issues.push({
      path: "yellowAccumulationLimit",
      message: "Deve ser ≥ 1"
    });
  }

  if (issues.length > 0) {
    throw new ValidationError("Regulamento inválido", issues);
  }
}
