import { getDb, getSetting } from "./db";
import { siteBaseUrl } from "./site-url";
import { DEFAULT_SETTINGS } from "./defaults";
import { formatBRL, formatDateLong, formatDuration } from "./format";
import type { NotificationsSettings } from "./types";

/** Celulares do admin: aceita string (antigo) ou lista (novo), separados por
 *  vírgula, ponto e vírgula ou quebra de linha. */
export function adminPhones(): string[] {
  const cfg = getSetting<NotificationsSettings>(
    "notifications",
    DEFAULT_SETTINGS.notifications as NotificationsSettings
  );

  const raw = Array.isArray(cfg.studioPhones)
    ? cfg.studioPhones.join(",")
    : cfg.studioPhones || cfg.studioPhone || "";

  return String(raw)
    .split(/[,;\n]+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p, i, arr) => arr.indexOf(p) === i);
}

/** Converte "(24) 98153-1771" em "5524981531771" para o link wa.me. */
export function toWaNumber(phone: string): string {
  const digits = String(phone).replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  return `55${digits}`;
}

export function waLink(phone: string, message: string): string {
  const num = toWaNumber(phone);
  if (!num) return "";
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}

function baseUrl(): string {
  return siteBaseUrl();
}

type AppointmentInfo = {
  id?: number;
  code: string;
  clientName: string;
  clientPhone?: string | null;
  serviceName: string;
  durationMin: number;
  date: string;
  time: string;
  totalCents: number;
  feeCents: number;
  remainderCents: number;
  /** Tamanho do cabelo escolhido (quando o serviço pede). */
  hairSize?: string | null;
  /** Acréscimo do tamanho, em centavos. */
  hairSizeCents?: number;
};

function header(kind: "booking" | "confirmed"): string {
  return kind === "confirmed"
    ? "✅ PAGAMENTO APROVADO — RESERVA CONFIRMADA"
    : "🔔 NOVA RESERVA — aguardando pagamento";
}

/**
 * Toda mensagem se apresenta como a secretária virtual do studio antes de
 * detalhar o agendamento (pedido da cliente: a atendente se chama HADASSA e
 * sempre se identifica como secretária virtual).
 */
function identificacao(kind: "booking" | "confirmed"): string[] {
  return [
    "",
    "Sou a HADASSA, secretária virtual do Studio Liso Espelhado com Beatriz Ribeiro.",
    kind === "confirmed"
      ? "Pagamento aprovado — a reserva está confirmada. Detalhes do agendamento:"
      : "Chegou um novo agendamento (aguardando pagamento). Detalhes:",
    "",
  ];
}

export function buildMessage(
  a: AppointmentInfo,
  kind: "booking" | "confirmed"
): string {
  // % vem do banco (Conteúdo → Taxa) — nunca fixar o número aqui.
  const feePercent = getSetting(
    "fee",
    DEFAULT_SETTINGS.fee as { percent: number; label: string; note: string }
  ).percent;

  const linhas = [
    header(kind),
    ...identificacao(kind),
    `Código: ${a.code}`,
    `Cliente: ${a.clientName}${a.clientPhone ? ` (${a.clientPhone})` : ""}`,
    `Serviço: ${a.serviceName} — ${formatDuration(a.durationMin)}`,
    ...(a.hairSize
      ? [
          `Tamanho do cabelo: ${a.hairSize}${
            a.hairSizeCents ? ` — acréscimo ${formatBRL(a.hairSizeCents)}` : ""
          }`,
        ]
      : []),
    `Data: ${formatDateLong(a.date)} às ${a.time}`,
    `Procedimento: ${formatBRL(a.totalCents)}`,
    `Taxa ${feePercent}%: ${formatBRL(a.feeCents)}`,
    `Restante no studio: ${formatBRL(a.remainderCents)}`,
    "",
    `Ver na agenda: ${baseUrl()}/admin/agenda?date=${a.date}`,
  ];
  return linhas.join("\n");
}

/**
 * Registra uma notificação para cada celular cadastrado no painel
 * (Conteúdo → Avisos). Retorna quantas foram criadas.
 */
export function notifyAdmins(
  a: AppointmentInfo,
  kind: "booking" | "confirmed"
): number {
  const cfg = getSetting<NotificationsSettings>(
    "notifications",
    DEFAULT_SETTINGS.notifications as NotificationsSettings
  );
  // Checkbox "Enviar aviso ao studio a cada novo agendamento" (default: sim).
  if (cfg.studioEmailEnabled === false) return 0;

  const phones = adminPhones();
  if (phones.length === 0) return 0;

  const message = buildMessage(a, kind);
  const db = getDb();
  const stmt = db.prepare(
    `INSERT INTO notifications (appointment_id, kind, phone, message, wa_link, status)
     VALUES (?, ?, ?, ?, ?, 'pending')`
  );

  let criadas = 0;
  for (const phone of phones) {
    stmt.run(a.id ?? null, kind, phone, message, waLink(phone, message));
    criadas++;
  }
  return criadas;
}

export function listNotifications(limit = 60) {
  const rows = getDb()
    .prepare(
      `SELECT id, appointment_id, kind, phone, message, wa_link, status, created_at, read_at
         FROM notifications
        ORDER BY created_at DESC, id DESC
        LIMIT ?`
    )
    .all(limit) as unknown as {
    id: number;
    appointment_id: number | null;
    kind: string;
    phone: string;
    message: string;
    wa_link: string;
    status: string;
    created_at: string;
    read_at: string | null;
  }[];
  return rows.map((r) => ({ ...r }));
}

export function countUnreadNotifications(): number {
  const row = getDb()
    .prepare("SELECT COUNT(*) AS n FROM notifications WHERE status = 'pending'")
    .get() as { n: number };
  return row.n;
}
