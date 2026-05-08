// Clock label — sempre "MM:SS", crescente, derivado de timestamp inicial.
// Arquitetura §3.3: cronômetro nunca persistido em segundos; é (now - period_started_at).

import { ValidationError } from "@/shared/errors";

const CLOCK_REGEX = /^(\d{1,3}):([0-5]\d)$/;

export function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    throw new ValidationError("Segundos inválidos para cronômetro");
  }
  const total = Math.floor(seconds);
  const mm = Math.floor(total / 60);
  const ss = total % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

export function parseClock(label: string): number {
  const match = CLOCK_REGEX.exec(label);
  if (!match) {
    throw new ValidationError(`clock_label inválido: ${label}`);
  }
  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  return minutes * 60 + seconds;
}

export function elapsedSeconds(periodStartedAt: Date, now: Date = new Date()): number {
  const diff = (now.getTime() - periodStartedAt.getTime()) / 1000;
  return Math.max(0, Math.floor(diff));
}

export function isClockLabelValid(label: string): boolean {
  return CLOCK_REGEX.test(label);
}
