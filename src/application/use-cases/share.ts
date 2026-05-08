// Geração do documento estruturado da súmula (RF §16.1, §16.3).
// O card visual server-side fica como TODO — sem libs de imagem instaladas, expomos
// um endpoint OG/HTML como fallback que browsers/WhatsApp consomem.

import { prisma } from "@/infrastructure/db";
import type { TimelineEvent as DomainEvent } from "@/shared/types";
import { NotFoundError } from "@/shared/errors";

const TYPE_LABEL: Record<string, string> = {
  gol: "Gol",
  gol_contra: "Gol contra",
  cartao_amarelo: "Cartão amarelo",
  cartao_vermelho: "Cartão vermelho",
  cartao_azul: "Cartão azul",
  falta: "Falta",
  substituicao: "Substituição",
  troca_goleiro: "Troca de goleiro",
  inicio_periodo: "Início de período",
  fim_periodo: "Fim de período"
};

export async function buildScoresheetDocument(matchId: string): Promise<string> {
  const ss = await prisma.scoresheet.findUnique({
    where: { matchId },
    include: {
      match: {
        include: {
          homeTeam: true,
          awayTeam: true,
          round: { include: { championship: true } }
        }
      },
      timelineEvents: { orderBy: { recordedAt: "asc" } },
      presenceRecords: { include: { player: true } },
      penaltyShoot: { include: { kicks: { orderBy: { kickOrder: "asc" } } } }
    }
  });
  if (!ss) throw new NotFoundError("Súmula não encontrada");

  const m = ss.match;
  const lines: string[] = [];

  lines.push(`# ${m.round.championship.name} — ${m.round.label ?? `Rodada ${m.round.number}`}`);
  lines.push(
    `Data: ${m.scheduledAt.toLocaleString("pt-BR")}${m.venue ? ` — Local: ${m.venue}` : ""}`
  );
  if (m.refereeNameText) lines.push(`Árbitro: ${m.refereeNameText}`);
  if (m.homeResponsible) lines.push(`Responsável ${m.homeTeam.name}: ${m.homeResponsible}`);
  if (m.awayResponsible) lines.push(`Responsável ${m.awayTeam.name}: ${m.awayResponsible}`);

  // Placar
  if (ss.penaltyShoot) {
    lines.push("");
    lines.push(
      `**Placar:** ${m.homeTeam.name} ${ss.homeScore} x ${ss.awayScore} ${m.awayTeam.name} (${ss.penaltyShoot.homeScore} x ${ss.penaltyShoot.awayScore} nos pênaltis)`
    );
  } else {
    lines.push("");
    lines.push(`**Placar:** ${m.homeTeam.name} ${ss.homeScore} x ${ss.awayScore} ${m.awayTeam.name}`);
  }

  // Elenco
  for (const team of [m.homeTeam, m.awayTeam]) {
    const presents = ss.presenceRecords
      .filter((p) => p.player.teamId === team.id && p.present)
      .sort((a, b) => (a.jerseyNumber ?? 0) - (b.jerseyNumber ?? 0));
    if (presents.length > 0) {
      lines.push("");
      lines.push(`**Elenco — ${team.name}:**`);
      for (const p of presents) {
        const num = p.jerseyNumber ?? "?";
        const tag = p.isGoalkeeper ? " (goleiro)" : "";
        lines.push(`- #${num} ${p.player.fullName}${tag}`);
      }
    }
  }

  // Timeline
  const realEvents = ss.timelineEvents.filter(
    (e) => e.type !== "inicio_periodo"
  );
  if (realEvents.length > 0) {
    lines.push("");
    lines.push(`**Timeline:**`);
    for (const e of realEvents as unknown as DomainEvent[]) {
      const team = e.teamId === m.homeTeamId ? m.homeTeam.name : m.awayTeam.name;
      const label = TYPE_LABEL[e.type] ?? e.type;
      const playerSegment = await formatEventPlayer(e, ss);
      lines.push(`- ${e.clockLabel}' — ${label}${playerSegment} — ${team}`);
    }
  }

  // Pênaltis
  if (ss.penaltyShoot && ss.penaltyShoot.kicks.length > 0) {
    lines.push("");
    lines.push(`**Pênaltis:**`);
    for (const k of ss.penaltyShoot.kicks) {
      const team = k.teamId === m.homeTeamId ? m.homeTeam.name : m.awayTeam.name;
      const status = k.converted ? "convertido" : "errou";
      lines.push(`- ${k.kickOrder}ª — ${team} — ${status}`);
    }
  }

  return lines.join("\n");
}

async function formatEventPlayer(
  e: DomainEvent,
  ss: { presenceRecords: { playerId: string; jerseyNumber: number | null; player: { fullName: string } }[] }
) {
  if (!e.playerId) return "";
  const rec = ss.presenceRecords.find((p) => p.playerId === e.playerId);
  if (!rec) return "";
  const num = rec.jerseyNumber ?? "?";
  return ` — #${num} ${rec.player.fullName}`;
}
