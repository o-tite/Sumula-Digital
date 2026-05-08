import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const orgPwd = await bcrypt.hash("admin123", 10);
  const refPwd = await bcrypt.hash("mesa123", 10);

  const org = await prisma.user.upsert({
    where: { email: "admin@saintclair.com" },
    update: {},
    create: {
      email: "admin@saintclair.com",
      name: "Organizador Principal",
      passwordHash: orgPwd,
      role: "ORGANIZER"
    }
  });

  const referee = await prisma.user.upsert({
    where: { email: "mesario@saintclair.com" },
    update: {},
    create: {
      email: "mesario@saintclair.com",
      name: "Mesário Demo",
      passwordHash: refPwd,
      role: "REFEREE"
    }
  });

  const existing = await prisma.championship.findFirst({
    where: { status: "em_andamento" }
  });
  if (existing) {
    console.log("Seed: campeonato já existe, mantendo.");
    return;
  }

  const champ = await prisma.championship.create({
    data: {
      name: "Copa Saint Clair Demo",
      modality: "futsal",
      season: "2026",
      status: "em_andamento",
      regulation: {
        create: {
          numPeriods: 2,
          periodDurationMin: 20,
          intervalDurationMin: 5,
          cardTypes: "amarelo_vermelho",
          yellowAccumulationLimit: 3,
          foulFreeKickEnabled: true,
          foulFreeKickLimit: 5,
          foulIndividualEnabled: false,
          penaltiesEnabled: true,
          penaltyKicksPerTeam: 5,
          pointsPenaltyWin: 2,
          pointsPenaltyLoss: 1,
          pointsWin: 3,
          pointsDraw: 1,
          pointsLoss: 0,
          tiebreakOrder: JSON.stringify(["confronto_direto", "saldo_gols", "gols_pro"]),
          goalkeeperRankingFormula: "media"
        }
      }
    }
  });

  const teamA = await prisma.team.create({
    data: {
      championshipId: champ.id,
      name: "Leões FC",
      color: "#1E88E5"
    }
  });
  const teamB = await prisma.team.create({
    data: {
      championshipId: champ.id,
      name: "Tigres EC",
      color: "#6A1B9A"
    }
  });

  const playersA = ["João Silva", "Pedro Santos", "Carlos Souza", "André Lima", "Bruno Alves"];
  const playersB = ["Marcos Pereira", "Rafael Dias", "Lucas Costa", "Felipe Oliveira", "Daniel Rocha"];

  for (const name of playersA) {
    await prisma.player.create({ data: { teamId: teamA.id, fullName: name } });
  }
  for (const name of playersB) {
    await prisma.player.create({ data: { teamId: teamB.id, fullName: name } });
  }

  const round = await prisma.round.create({
    data: { championshipId: champ.id, number: 1, label: "Rodada 1" }
  });

  await prisma.match.create({
    data: {
      roundId: round.id,
      homeTeamId: teamA.id,
      awayTeamId: teamB.id,
      refereeUserId: referee.id,
      refereeNameText: "Carlos Eduardo (árbitro)",
      scheduledAt: new Date(Date.now() + 60_000),
      venue: "Ginásio Saint Clair",
      status: "agendado"
    }
  });

  console.log("Seed concluído.");
  console.log(`Organizador: admin@saintclair.com / admin123`);
  console.log(`Mesário:     mesario@saintclair.com / mesa123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
