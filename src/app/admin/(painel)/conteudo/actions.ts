"use server";

import { revalidatePath } from "next/cache";
import { getDb, getSetting, setSetting } from "@/lib/db";
import { DEFAULT_SETTINGS } from "@/lib/defaults";
import { getSiteSettings, type SiteSettings } from "@/lib/queries";
import { getSession } from "@/lib/session";
import type { Schedule } from "@/lib/types";

const DEFAULT_SCHEDULE = DEFAULT_SETTINGS.schedule as Schedule;

const WEEKDAY_LABELS = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

function refresh() {
  revalidatePath("/", "layout");
}

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function lines(formData: FormData, key: string): string[] {
  return String(formData.get(key) ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export async function saveContactAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;

  const current = getSiteSettings();
  const whatsapp = text(formData, "whatsapp");
  const digits = whatsapp.replace(/\D/g, "");

  setSetting("site", {
    ...current.site,
    name: text(formData, "name") || current.site.name,
    signature: text(formData, "signature"),
    headline: text(formData, "headline"),
    tagline: text(formData, "tagline"),
    description: text(formData, "description"),
    whatsapp,
    whatsappLink: digits.length >= 10 ? `55${digits}` : current.site.whatsappLink,
    instagram: text(formData, "instagram"),
    instagramLink: text(formData, "instagramLink"),
    email: text(formData, "email"),
    address: text(formData, "address"),
    mapsUrl: text(formData, "mapsUrl"),
    hours: text(formData, "hours"),
    ctaPrimary: text(formData, "ctaPrimary"),
    ctaSecondary: text(formData, "ctaSecondary"),
  });

  refresh();
}

export async function saveHeroAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;

  setSetting("hero", {
    eyebrow: text(formData, "eyebrow"),
    title: text(formData, "title"),
    subtitle: text(formData, "subtitle"),
    image: text(formData, "image") || null,
  });

  refresh();
}

export async function saveAboutAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;
  const current = getSiteSettings();

  setSetting("about", {
    title: text(formData, "title") || current.about.title,
    role: text(formData, "role"),
    photo: text(formData, "photo") || null,
    story: text(formData, "story"),
    philosophy: text(formData, "philosophy"),
    specialties: lines(formData, "specialties"),
    credentials: lines(formData, "credentials"),
  });

  refresh();
}

export async function saveSeoAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;

  setSetting("seo", {
    title: text(formData, "title"),
    description: text(formData, "description"),
    keywords: lines(formData, "keywords"),
  });

  refresh();
}

export async function saveNotificationsAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;

  // Um ou vários celulares (um por linha) — todos recebem o aviso.
  const phones = text(formData, "studioPhones")
    .split(/\r?\n|,|;/)
    .map((p) => p.trim())
    .filter(Boolean);

  setSetting("notifications", {
    studioPhone: phones[0] || text(formData, "studioPhone"),
    studioPhones: phones.join("\n"),
    clientEmailEnabled: formData.get("clientEmailEnabled") === "on",
    studioEmailEnabled: formData.get("studioEmailEnabled") === "on",
  });

  refresh();
}

/**
 * Cadastro dos dados de recebimento: conta Nubank, chave PIX e CNPJ.
 * O cliente vê esses dados na etapa de pagamento do agendamento.
 */
export async function savePaymentAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;
  const current = getSiteSettings();

  // CNPJ e chave PIX guardados só com dígitos (a exibição formata).
  const cnpj = text(formData, "cnpj").replace(/\D/g, "");
  const pixKey = text(formData, "pixKey").trim();

  setSetting("payment", {
    ...current.payment,
    enabled: formData.get("enabled") === "on",
    pixEnabled: formData.get("pixEnabled") === "on",
    pixKey,
    cardEnabled: formData.get("cardEnabled") === "on",
    cardLink: text(formData, "cardLink"),
    cardTerms: text(formData, "cardTerms"),
    bank: text(formData, "bank") || current.payment.bank,
    agency: text(formData, "agency"),
    account: text(formData, "account"),
    cnpj,
    holder: text(formData, "holder"),
  });

  refresh();
}

export async function saveHoursAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;

  const db = getDb();
  const stmt = db.prepare(
    "UPDATE working_hours SET open_time = ?, close_time = ?, closed = ? WHERE weekday = ?"
  );

  for (let weekday = 0; weekday <= 6; weekday++) {
    const closed = formData.get(`closed_${weekday}`) === "on";
    const open = text(formData, `open_${weekday}`) || "09:00";
    const close = text(formData, `close_${weekday}`) || "18:00";
    stmt.run(open, close, closed ? 1 : 0, weekday);
  }

  const summary = text(formData, "summary");
  if (summary) {
    const current = getSiteSettings();
    setSetting("site", { ...current.site, hours: summary });
  }

  // Regra de agenda: dia dedicado às unhas (ex.: quarta-feira).
  const current = getSetting<Schedule>("schedule", DEFAULT_SCHEDULE);
  const weekday = Number.parseInt(text(formData, "nailWeekday"), 10);
  const nailWeekday =
    Number.isFinite(weekday) && weekday >= 0 && weekday <= 6
      ? weekday
      : current.nailWeekday;

  setSetting("schedule", {
    ...current,
    nailWeekday,
    nailWeekdayLabel: WEEKDAY_LABELS[nailWeekday],
    hairBlockedOnNailDay: formData.get("hairBlockedOnNailDay") === "on",
  });

  refresh();
}

/**
 * Taxa de agendamento (%).
 * É o ÚNICO lugar de onde sai o número: alimenta o cálculo (feeFor), a
 * exibição na home/serviços/promoções, o agendamento e os avisos.
 * Aceita vírgula ("12,5") ou ponto ("12.5"); fora de 0–100 mantém o valor
 * salvo (não grava lixo).
 */
export async function saveFeeAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;

  const current = getSiteSettings();
  const parsed = Number.parseFloat(text(formData, "percent").replace(",", "."));
  const percent =
    Number.isFinite(parsed) && parsed >= 0 && parsed <= 100
      ? Math.round(parsed * 100) / 100
      : current.fee.percent;

  setSetting("fee", {
    ...current.fee,
    percent,
    label: text(formData, "label") || current.fee.label,
    note: text(formData, "note"),
  });

  refresh();
}
