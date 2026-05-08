// Use cases de campeonato e regulamento (RF §2).

import { prisma } from "@/infrastructure/db";
import { validateRegulation } from "@/domain/regulation-validation";
import { NotFoundError, StateError, ValidationError } from "@/shared/errors";
import type { Modality, RegulationData, TiebreakCriterion } from "@/shared/types";

const VALID_MODALITIES: Modality[] = ["futsal", "suico", "campo"];

export async function listChampionships() {
  return prisma.championship.findMany({
    orderBy: { createdAt: "desc" },
    include: { regulation: true }
  });
}

export async function createChampionship(input: {
  name: string;
  modality: string;
  season: string;
  seriesName?: string;
}) {
  if (!input.name?.trim()) {
    throw new ValidationError("Nome é obrigatório");
  }
  if (!VALID_MODALITIES.includes(input.modality as Modality)) {
    throw new ValidationError("Modalidade inválida", [
      { path: "modality", message: "Use futsal | suico | campo" }
    ]);
  }
  if (!input.season?.trim()) {
    throw new ValidationError("Temporada é obrigatória");
  }

  // RF §2.1: apenas um campeonato em_andamento por vez
  const existing = await prisma.championship.findFirst({
    where: { status: "em_andamento" }
  });
  if (existing) {
    throw new StateError("Já existe um campeonato em andamento. Encerre-o primeiro.");
  }

  const series = input.seriesName
    ? await prisma.championshipSeries.create({ data: { name: input.seriesName } })
    : null;

  return prisma.championship.create({
    data: {
      name: input.name.trim(),
      modality: input.modality,
      season: input.season.trim(),
      status: "em_andamento",
      seriesId: series?.id
    }
  });
}

export async function getChampionship(id: string) {
  const c = await prisma.championship.findUnique({
    where: { id },
    include: { regulation: true, teams: true, rounds: { include: { matches: true } } }
  });
  if (!c) throw new NotFoundError("Campeonato não encontrado");
  return c;
}

export async function upsertRegulation(championshipId: string, data: RegulationData) {
  validateRegulation(data);

  const champ = await prisma.championship.findUnique({ where: { id: championshipId } });
  if (!champ) throw new NotFoundError("Campeonato não encontrado");

  const payload = {
    numPeriods: data.numPeriods,
    periodDurationMin: data.periodDurationMin,
    intervalDurationMin: data.intervalDurationMin,
    cardTypes: data.cardTypes,
    cardBlueMode: data.cardBlueMode,
    cardBlueDurationMin: data.cardBlueDurationMin,
    yellowAccumulationLimit: data.yellowAccumulationLimit,
    foulFreeKickEnabled: data.foulFreeKickEnabled,
    foulFreeKickLimit: data.foulFreeKickLimit,
    foulIndividualEnabled: data.foulIndividualEnabled,
    foulIndividualLimit: data.foulIndividualLimit,
    penaltiesEnabled: data.penaltiesEnabled,
    penaltyKicksPerTeam: data.penaltyKicksPerTeam,
    pointsPenaltyWin: data.pointsPenaltyWin,
    pointsPenaltyLoss: data.pointsPenaltyLoss,
    pointsWin: data.pointsWin,
    pointsDraw: data.pointsDraw,
    pointsLoss: data.pointsLoss,
    tiebreakOrder: JSON.stringify(data.tiebreakOrder satisfies TiebreakCriterion[]),
    goalkeeperRankingFormula: data.goalkeeperRankingFormula
  } as const;

  return prisma.regulation.upsert({
    where: { championshipId },
    update: payload,
    create: { championshipId, ...payload }
  });
}

export function regulationFromDb(reg: {
  numPeriods: number;
  periodDurationMin: number;
  intervalDurationMin: number;
  cardTypes: string;
  cardBlueMode: string | null;
  cardBlueDurationMin: number | null;
  yellowAccumulationLimit: number;
  foulFreeKickEnabled: boolean;
  foulFreeKickLimit: number;
  foulIndividualEnabled: boolean;
  foulIndividualLimit: number | null;
  penaltiesEnabled: boolean;
  penaltyKicksPerTeam: number;
  pointsPenaltyWin: number;
  pointsPenaltyLoss: number;
  pointsWin: number;
  pointsDraw: number;
  pointsLoss: number;
  tiebreakOrder: string;
  goalkeeperRankingFormula: string;
}): RegulationData {
  return {
    numPeriods: reg.numPeriods,
    periodDurationMin: reg.periodDurationMin,
    intervalDurationMin: reg.intervalDurationMin,
    cardTypes: reg.cardTypes as RegulationData["cardTypes"],
    cardBlueMode: (reg.cardBlueMode as RegulationData["cardBlueMode"]) ?? null,
    cardBlueDurationMin: reg.cardBlueDurationMin,
    yellowAccumulationLimit: reg.yellowAccumulationLimit,
    foulFreeKickEnabled: reg.foulFreeKickEnabled,
    foulFreeKickLimit: reg.foulFreeKickLimit,
    foulIndividualEnabled: reg.foulIndividualEnabled,
    foulIndividualLimit: reg.foulIndividualLimit,
    penaltiesEnabled: reg.penaltiesEnabled,
    penaltyKicksPerTeam: reg.penaltyKicksPerTeam,
    pointsPenaltyWin: reg.pointsPenaltyWin,
    pointsPenaltyLoss: reg.pointsPenaltyLoss,
    pointsWin: reg.pointsWin,
    pointsDraw: reg.pointsDraw,
    pointsLoss: reg.pointsLoss,
    tiebreakOrder: JSON.parse(reg.tiebreakOrder) as TiebreakCriterion[],
    goalkeeperRankingFormula: reg.goalkeeperRankingFormula as RegulationData["goalkeeperRankingFormula"]
  };
}
