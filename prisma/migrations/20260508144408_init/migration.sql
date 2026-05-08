-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ChampionshipSeries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Championship" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "seriesId" TEXT,
    "name" TEXT NOT NULL,
    "modality" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'em_andamento',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Championship_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "ChampionshipSeries" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Regulation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "championshipId" TEXT NOT NULL,
    "numPeriods" INTEGER NOT NULL DEFAULT 2,
    "periodDurationMin" INTEGER NOT NULL DEFAULT 20,
    "intervalDurationMin" INTEGER NOT NULL DEFAULT 5,
    "cardTypes" TEXT NOT NULL DEFAULT 'amarelo_vermelho',
    "cardBlueMode" TEXT,
    "cardBlueDurationMin" INTEGER,
    "yellowAccumulationLimit" INTEGER NOT NULL DEFAULT 3,
    "foulFreeKickEnabled" BOOLEAN NOT NULL DEFAULT false,
    "foulFreeKickLimit" INTEGER NOT NULL DEFAULT 5,
    "foulIndividualEnabled" BOOLEAN NOT NULL DEFAULT false,
    "foulIndividualLimit" INTEGER,
    "penaltiesEnabled" BOOLEAN NOT NULL DEFAULT false,
    "penaltyKicksPerTeam" INTEGER NOT NULL DEFAULT 5,
    "pointsPenaltyWin" INTEGER NOT NULL DEFAULT 2,
    "pointsPenaltyLoss" INTEGER NOT NULL DEFAULT 1,
    "pointsWin" INTEGER NOT NULL DEFAULT 3,
    "pointsDraw" INTEGER NOT NULL DEFAULT 1,
    "pointsLoss" INTEGER NOT NULL DEFAULT 0,
    "tiebreakOrder" TEXT NOT NULL DEFAULT '["confronto_direto","saldo_gols","gols_pro"]',
    "goalkeeperRankingFormula" TEXT NOT NULL DEFAULT 'media',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Regulation_championshipId_fkey" FOREIGN KEY ("championshipId") REFERENCES "Championship" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "championshipId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "color" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Team_championshipId_fkey" FOREIGN KEY ("championshipId") REFERENCES "Championship" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Round" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "championshipId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "label" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Round_championshipId_fkey" FOREIGN KEY ("championshipId") REFERENCES "Championship" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roundId" TEXT NOT NULL,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,
    "refereeUserId" TEXT,
    "refereeNameText" TEXT,
    "homeResponsible" TEXT,
    "awayResponsible" TEXT,
    "scheduledAt" DATETIME NOT NULL,
    "venue" TEXT,
    "status" TEXT NOT NULL DEFAULT 'agendado',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Match_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Match_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_refereeUserId_fkey" FOREIGN KEY ("refereeUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Scoresheet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'em_andamento',
    "uiState" TEXT NOT NULL DEFAULT 'pre_jogo',
    "currentPeriod" INTEGER NOT NULL DEFAULT 0,
    "periodStartedAt" DATETIME,
    "homeScore" INTEGER NOT NULL DEFAULT 0,
    "awayScore" INTEGER NOT NULL DEFAULT 0,
    "homeGoalkeeperPlayerId" TEXT,
    "awayGoalkeeperPlayerId" TEXT,
    "homeGoalkeeperAvulsoName" TEXT,
    "homeGoalkeeperAvulsoJersey" INTEGER,
    "awayGoalkeeperAvulsoName" TEXT,
    "awayGoalkeeperAvulsoJersey" INTEGER,
    "startedAt" DATETIME,
    "finishedAt" DATETIME,
    "savedAt" DATETIME,
    "editLog" TEXT NOT NULL DEFAULT '[]',
    "shareCardUrl" TEXT,
    "shareDocText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Scoresheet_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PresenceRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scoresheetId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "jerseyNumber" INTEGER,
    "present" BOOLEAN NOT NULL DEFAULT false,
    "absenceType" TEXT,
    "isGoalkeeper" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "PresenceRecord_scoresheetId_fkey" FOREIGN KEY ("scoresheetId") REFERENCES "Scoresheet" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PresenceRecord_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TimelineEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scoresheetId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "clockLabel" TEXT NOT NULL,
    "playerId" TEXT,
    "teamId" TEXT NOT NULL,
    "secondaryPlayerId" TEXT,
    "period" INTEGER NOT NULL,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "autoGeneratedFromId" TEXT,
    "clientEventId" TEXT,
    CONSTRAINT "TimelineEvent_scoresheetId_fkey" FOREIGN KEY ("scoresheetId") REFERENCES "Scoresheet" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TimelineEvent_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TimelineEvent_secondaryPlayerId_fkey" FOREIGN KEY ("secondaryPlayerId") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PenaltyShoot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scoresheetId" TEXT NOT NULL,
    "homeScore" INTEGER NOT NULL DEFAULT 0,
    "awayScore" INTEGER NOT NULL DEFAULT 0,
    "finished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PenaltyShoot_scoresheetId_fkey" FOREIGN KEY ("scoresheetId") REFERENCES "Scoresheet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PenaltyKick" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "penaltyShootId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "playerId" TEXT,
    "kickOrder" INTEGER NOT NULL,
    "converted" BOOLEAN NOT NULL,
    CONSTRAINT "PenaltyKick_penaltyShootId_fkey" FOREIGN KEY ("penaltyShootId") REFERENCES "PenaltyShoot" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SuspensionLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "championshipId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "sourceMatchId" TEXT NOT NULL,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SuspensionLog_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SuspensionLog_championshipId_fkey" FOREIGN KEY ("championshipId") REFERENCES "Championship" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SuspensionLog_sourceMatchId_fkey" FOREIGN KEY ("sourceMatchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Occurrence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scoresheetId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "playersInvolved" TEXT NOT NULL DEFAULT '[]',
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Occurrence_scoresheetId_fkey" FOREIGN KEY ("scoresheetId") REFERENCES "Scoresheet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Regulation_championshipId_key" ON "Regulation"("championshipId");

-- CreateIndex
CREATE INDEX "Team_championshipId_idx" ON "Team"("championshipId");

-- CreateIndex
CREATE INDEX "Player_teamId_idx" ON "Player"("teamId");

-- CreateIndex
CREATE INDEX "Round_championshipId_number_idx" ON "Round"("championshipId", "number");

-- CreateIndex
CREATE INDEX "Match_roundId_status_idx" ON "Match"("roundId", "status");

-- CreateIndex
CREATE INDEX "Match_refereeUserId_idx" ON "Match"("refereeUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Scoresheet_matchId_key" ON "Scoresheet"("matchId");

-- CreateIndex
CREATE INDEX "PresenceRecord_scoresheetId_idx" ON "PresenceRecord"("scoresheetId");

-- CreateIndex
CREATE INDEX "PresenceRecord_playerId_present_idx" ON "PresenceRecord"("playerId", "present");

-- CreateIndex
CREATE UNIQUE INDEX "PresenceRecord_scoresheetId_playerId_key" ON "PresenceRecord"("scoresheetId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "TimelineEvent_clientEventId_key" ON "TimelineEvent"("clientEventId");

-- CreateIndex
CREATE INDEX "TimelineEvent_scoresheetId_period_idx" ON "TimelineEvent"("scoresheetId", "period");

-- CreateIndex
CREATE INDEX "TimelineEvent_scoresheetId_type_idx" ON "TimelineEvent"("scoresheetId", "type");

-- CreateIndex
CREATE INDEX "TimelineEvent_playerId_type_idx" ON "TimelineEvent"("playerId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "PenaltyShoot_scoresheetId_key" ON "PenaltyShoot"("scoresheetId");

-- CreateIndex
CREATE INDEX "PenaltyKick_penaltyShootId_kickOrder_idx" ON "PenaltyKick"("penaltyShootId", "kickOrder");

-- CreateIndex
CREATE UNIQUE INDEX "PenaltyKick_penaltyShootId_kickOrder_key" ON "PenaltyKick"("penaltyShootId", "kickOrder");

-- CreateIndex
CREATE INDEX "SuspensionLog_playerId_championshipId_confirmed_idx" ON "SuspensionLog"("playerId", "championshipId", "confirmed");

-- CreateIndex
CREATE INDEX "SuspensionLog_sourceMatchId_idx" ON "SuspensionLog"("sourceMatchId");
