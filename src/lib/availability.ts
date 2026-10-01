import { busyIntervalsFor, listBlocks, listWorkingHours } from "./queries";
import { parseDate, toISO } from "./format";
import { getSetting } from "./db";
import { DEFAULT_SETTINGS } from "./defaults";
import type { Schedule, ServiceTrack } from "./types";

export interface SlotResult {
  closed: boolean;
  slots: string[];
  reason?: string;
  openTime?: string;
  closeTime?: string;
}

export interface SlotOptions {
  now?: Date;
  /** Ignora um agendamento específico (a própria reserva). */
  excludeId?: number;
  /** Trilha do serviço: cabelo ou unha — controla o dia de unhas. */
  track?: ServiceTrack;
  /**
   * Aplica a regra do dia de unhas. `false` é usado ao aprovar uma reserva já
   * criada — mudar a regra depois não pode cancelar um atendimento existente.
   */
  enforceTrack?: boolean;
}

/** Regra: às quartas-feiras atende-se apenas unhas (sem cabelo). */
export function trackAllowed(
  weekday: number,
  track: ServiceTrack
): { allowed: boolean; reason?: string } {
  const schedule = getSetting<Schedule>(
    "schedule",
    DEFAULT_SETTINGS.schedule as Schedule
  );
  if (!schedule.hairBlockedOnNailDay) return { allowed: true };

  const nailWeekday = Number(schedule.nailWeekday ?? 3);
  const label =
    schedule.nailWeekdayLabel ||
    ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"][nailWeekday];

  if (track === "nails" && weekday !== nailWeekday) {
    return {
      allowed: false,
      reason: `Atendimento de unhas somente na ${label}.`,
    };
  }

  if (track === "hair" && weekday === nailWeekday) {
    return {
      allowed: false,
      reason: `Dia de unhas: na ${label} não há atendimento de cabelo.`,
    };
  }

  return { allowed: true };
}

export const SLOT_STEP_MIN = 30;
export const LEAD_TIME_MIN = 60;

export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function toTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${`${h}`.padStart(2, "0")}:${`${m}`.padStart(2, "0")}`;
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}

/** Gera os horários livres de uma data para a duração informada. */
export function availableSlots(
  dateISO: string,
  durationMin: number,
  options: SlotOptions = {}
): SlotResult {
  const date = parseDate(dateISO);
  if (Number.isNaN(date.getTime())) {
    return { closed: true, slots: [], reason: "Data inválida." };
  }

  const hours = listWorkingHours();
  const working = hours.find((h) => h.weekday === date.getDay());

  // Regra de agenda: quarta é dia de unha (sem atendimento de cabelo).
  if (options.enforceTrack !== false) {
    const track = options.track ?? "hair";
    const rule = trackAllowed(date.getDay(), track);
    if (!rule.allowed) {
      return { closed: true, slots: [], reason: rule.reason };
    }
  }

  if (!working || working.closed) {
    return { closed: true, slots: [], reason: "Fechado neste dia." };
  }

  // Bloqueios manuais
  const blocks = listBlocks(dateISO);
  const fullDayBlock = blocks.find((b) => !b.start_time || !b.end_time);
  if (fullDayBlock) {
    return {
      closed: true,
      slots: [],
      reason: fullDayBlock.reason || "Dia bloqueado.",
    };
  }

  const busy = busyIntervalsFor(dateISO, options.excludeId);
  for (const block of blocks) {
    if (block.start_time && block.end_time) {
      busy.push({
        start: toMinutes(block.start_time),
        end: toMinutes(block.end_time),
      });
    }
  }

  const open = toMinutes(working.open_time);
  const close = toMinutes(working.close_time);
  const duration = Math.max(15, durationMin || 60);

  if (close - open < duration) {
    return {
      closed: true,
      slots: [],
      reason: "O expediente é menor que a duração do procedimento.",
    };
  }

  const now = options.now ?? new Date();
  const isToday = dateISO === toISO(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const earliest = isToday ? nowMin + LEAD_TIME_MIN : -1;

  const slots: string[] = [];
  for (let start = open; start + duration <= close; start += SLOT_STEP_MIN) {
    const end = start + duration;
    if (start < earliest) continue;
    if (busy.some((b) => overlaps(start, end, b.start, b.end))) continue;
    slots.push(toTime(start));
  }

  return {
    closed: slots.length === 0,
    slots,
    reason: slots.length === 0 ? "Sem horários disponíveis nesta data." : undefined,
    openTime: working.open_time,
    closeTime: working.close_time,
  };
}

/** Distinta: se o dia tem qualquer horário livre. */
export function hasAvailability(dateISO: string, durationMin: number): boolean {
  return availableSlots(dateISO, durationMin).slots.length > 0;
}
