// Máquina de estados da súmula (Arquitetura §3).
// Estados: pre_jogo → periodo_em_andamento → intervalo → ... → modal_penaltis | em_revisao → encerrado
// Transições explícitas — auxilia a UI e os use cases a validarem ações.

import { StateError } from "@/shared/errors";

export type ScoresheetState =
  | "pre_jogo"
  | "periodo_em_andamento"
  | "intervalo"
  | "modal_penaltis"
  | "em_revisao"
  | "encerrado"
  | "reaberto";

export type Transition =
  | "iniciar_periodo"
  | "encerrar_periodo"
  | "iniciar_intervalo"
  | "abrir_modal_penaltis"
  | "confirmar_penaltis"
  | "voltar_para_periodo"
  | "salvar_sumula"
  | "cancelar_sumula"
  | "reabrir_sumula"
  | "reabrir_periodo";

interface TransitionRule {
  from: ScoresheetState;
  to: ScoresheetState;
}

const RULES: Record<Transition, TransitionRule[]> = {
  iniciar_periodo: [
    { from: "pre_jogo", to: "periodo_em_andamento" },
    { from: "intervalo", to: "periodo_em_andamento" }
  ],
  encerrar_periodo: [
    { from: "periodo_em_andamento", to: "periodo_em_andamento" } // resolved by caller
  ],
  iniciar_intervalo: [{ from: "periodo_em_andamento", to: "intervalo" }],
  abrir_modal_penaltis: [{ from: "periodo_em_andamento", to: "modal_penaltis" }],
  confirmar_penaltis: [{ from: "modal_penaltis", to: "em_revisao" }],
  voltar_para_periodo: [{ from: "em_revisao", to: "periodo_em_andamento" }],
  salvar_sumula: [
    { from: "em_revisao", to: "encerrado" },
    { from: "reaberto", to: "encerrado" }
  ],
  cancelar_sumula: [{ from: "periodo_em_andamento", to: "pre_jogo" }],
  reabrir_sumula: [{ from: "encerrado", to: "reaberto" }],
  reabrir_periodo: [{ from: "intervalo", to: "periodo_em_andamento" }]
};

export function canTransition(from: ScoresheetState, transition: Transition): boolean {
  return (RULES[transition] ?? []).some((r) => r.from === from);
}

export function applyTransition(from: ScoresheetState, transition: Transition): ScoresheetState {
  const rule = (RULES[transition] ?? []).find((r) => r.from === from);
  if (!rule) {
    throw new StateError(
      `Transição ${transition} inválida a partir do estado ${from}`
    );
  }
  return rule.to;
}

/**
 * Após encerrar último período, decide próximo estado conforme placar e regulamento.
 */
export function decideAfterLastPeriod(args: {
  homeScore: number;
  awayScore: number;
  penaltiesEnabled: boolean;
}): "modal_penaltis" | "em_revisao" {
  if (args.penaltiesEnabled && args.homeScore === args.awayScore) {
    return "modal_penaltis";
  }
  return "em_revisao";
}
