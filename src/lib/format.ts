export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Percentual padrão da taxa de agendamento.
 * É só o FALLBACK (banco novo sem a chave "fee") — o valor real vem de
 * `settings.fee.percent`, que é editável no painel: Conteúdo → Taxa.
 * ⚠️ Nunca fixe aqui um valor diferente do banco: o site exibiria um % e
 * cobraria outro.
 */
export const DEFAULT_FEE_PERCENT = 15;

/**
 * Taxa de agendamento sobre o valor do procedimento.
 * `percent` vem sempre de `settings.fee.percent` (quem chama é quem tem as
 * settings); o default existe só para não quebrar chamada sem settings.
 */
export function feeFor(priceCents: number, percent: number = DEFAULT_FEE_PERCENT): number {
  return Math.round((priceCents * percent) / 100);
}

export function remainderFor(
  priceCents: number,
  percent: number = DEFAULT_FEE_PERCENT
): number {
  return priceCents - feeFor(priceCents, percent);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h${m.toString().padStart(2, "0")}` : `${h}h`;
}

const WEEKDAYS = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

const MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

/** Converte 'YYYY-MM-DD' em Date usando fuso local (sem deslocamento UTC). */
export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDateLong(iso: string): string {
  const d = parseDate(iso);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
}

export function formatDateShort(iso: string): string {
  const d = parseDate(iso);
  return `${`${d.getDate()}`.padStart(2, "0")}/${`${d.getMonth() + 1}`.padStart(2, "0")}/${d.getFullYear()}`;
}

export function formatTime(time: string): string {
  return time.slice(0, 5);
}

export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function maskCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** "53362957000144" → "53.362.957/0001-44" (CNPJ). */
export function formatCNPJ(value: string): string {
  const d = onlyDigits(value).slice(0, 14);
  if (d.length !== 14) return value.trim();
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}
