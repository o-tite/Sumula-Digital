import { prisma } from "@/infrastructure/db";
import { NotFoundError, ValidationError } from "@/shared/errors";

export async function listRounds(championshipId: string) {
  return prisma.round.findMany({
    where: { championshipId },
    orderBy: { number: "asc" },
    include: {
      matches: {
        include: {
          homeTeam: true,
          awayTeam: true,
          refereeUser: true,
          scoresheet: { select: { id: true, status: true } }
        }
      }
    }
  });
}

export async function createRound(input: {
  championshipId: string;
  number: number;
  label?: string;
}) {
  if (!Number.isInteger(input.number) || input.number < 1) {
    throw new ValidationError("Número da rodada inválido");
  }
  const champ = await prisma.championship.findUnique({
    where: { id: input.championshipId }
  });
  if (!champ) throw new NotFoundError("Campeonato não encontrado");
  return prisma.round.create({
    data: {
      championshipId: input.championshipId,
      number: input.number,
      label: input.label?.trim() || null
    }
  });
}
