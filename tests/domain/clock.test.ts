import { describe, it, expect } from "vitest";
import { formatClock, parseClock, elapsedSeconds, isClockLabelValid } from "@/domain/clock";

describe("clock", () => {
  it("formata segundos como MM:SS", () => {
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(59)).toBe("00:59");
    expect(formatClock(60)).toBe("01:00");
    expect(formatClock(74)).toBe("01:14");
    expect(formatClock(20 * 60 + 1)).toBe("20:01");
  });

  it("rejeita segundos inválidos", () => {
    expect(() => formatClock(-1)).toThrow();
    expect(() => formatClock(NaN)).toThrow();
  });

  it("parseia clock label válido em segundos", () => {
    expect(parseClock("00:00")).toBe(0);
    expect(parseClock("14:32")).toBe(14 * 60 + 32);
    expect(parseClock("99:59")).toBe(99 * 60 + 59);
  });

  it("rejeita clock label inválido", () => {
    expect(() => parseClock("abc")).toThrow();
    expect(() => parseClock("99:99")).toThrow();
  });

  it("calcula segundos decorridos desde period_started_at (TC-SUM-005, TC-GLB-002)", () => {
    const start = new Date("2026-01-01T10:00:00Z");
    const now = new Date("2026-01-01T10:14:32Z");
    expect(elapsedSeconds(start, now)).toBe(14 * 60 + 32);
  });

  it("nunca retorna negativo se now < start (clock skew)", () => {
    const start = new Date("2026-01-01T10:00:00Z");
    const now = new Date("2026-01-01T09:59:00Z");
    expect(elapsedSeconds(start, now)).toBe(0);
  });

  it("isClockLabelValid", () => {
    expect(isClockLabelValid("14:32")).toBe(true);
    expect(isClockLabelValid("foo")).toBe(false);
  });
});
