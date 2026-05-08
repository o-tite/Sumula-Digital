import { describe, it, expect } from "vitest";
import {
  applyTransition,
  canTransition,
  decideAfterLastPeriod
} from "@/domain/scoresheet-state";
import { StateError } from "@/shared/errors";

describe("scoresheet state machine", () => {
  it("pre_jogo → periodo_em_andamento via iniciar_periodo", () => {
    expect(canTransition("pre_jogo", "iniciar_periodo")).toBe(true);
    expect(applyTransition("pre_jogo", "iniciar_periodo")).toBe("periodo_em_andamento");
  });

  it("periodo_em_andamento → intervalo via iniciar_intervalo", () => {
    expect(applyTransition("periodo_em_andamento", "iniciar_intervalo")).toBe("intervalo");
  });

  it("intervalo → periodo_em_andamento via iniciar_periodo (próximo período)", () => {
    expect(applyTransition("intervalo", "iniciar_periodo")).toBe("periodo_em_andamento");
  });

  it("em_revisao → encerrado via salvar_sumula (TC-JOG-009)", () => {
    expect(applyTransition("em_revisao", "salvar_sumula")).toBe("encerrado");
  });

  it("encerrado → reaberto, depois reaberto → encerrado (TC-ORG-001 fluxo)", () => {
    expect(applyTransition("encerrado", "reabrir_sumula")).toBe("reaberto");
    expect(applyTransition("reaberto", "salvar_sumula")).toBe("encerrado");
  });

  it("transições inválidas lançam StateError", () => {
    expect(() => applyTransition("pre_jogo", "salvar_sumula")).toThrow(StateError);
    expect(() => applyTransition("encerrado", "iniciar_periodo")).toThrow(StateError);
  });

  it("decideAfterLastPeriod abre pênaltis quando empate + habilitado (TC-SUM-038)", () => {
    expect(
      decideAfterLastPeriod({ homeScore: 1, awayScore: 1, penaltiesEnabled: true })
    ).toBe("modal_penaltis");
  });

  it("decideAfterLastPeriod vai para revisão quando placar diferente (TC-SUM-037)", () => {
    expect(
      decideAfterLastPeriod({ homeScore: 2, awayScore: 1, penaltiesEnabled: true })
    ).toBe("em_revisao");
  });

  it("decideAfterLastPeriod vai para revisão quando empate sem pênaltis (TC-SUM-039)", () => {
    expect(
      decideAfterLastPeriod({ homeScore: 0, awayScore: 0, penaltiesEnabled: false })
    ).toBe("em_revisao");
  });
});
