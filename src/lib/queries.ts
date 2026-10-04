import { getDb, getSetting, plainRow, plainRows } from "./db";
import { DEFAULT_SETTINGS } from "./defaults";
import type {
  AppointmentWithRelations,
  Block,
  GalleryItem,
  PaymentSettings,
  Promotion,
  Service,
  Testimonial,
  WorkingHours,
} from "./types";

export interface SiteSettings {
  site: {
    name: string;
    signature: string;
    headline: string;
    tagline: string;
    description: string;
    whatsapp: string;
    whatsappLink: string;
    instagram: string;
    instagramLink: string;
    email: string;
    address: string;
    mapsUrl: string;
    hours: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  hero: { eyebrow: string; title: string; subtitle: string; image: string | null };
  about: {
    title: string;
    role: string;
    photo: string | null;
    story: string;
    philosophy: string;
    specialties: string[];
    credentials: string[];
  };
  seo: { title: string; description: string; keywords: string[] };
  fee: { percent: number; label: string; note: string };
  notifications: { studioPhone: string; studioPhones?: string | string[]; clientEmailEnabled: boolean; studioEmailEnabled: boolean };
  payment: PaymentSettings;
}

/**
 * Lê uma seção das configurações fundindo com o padrão da seção.
 * Assim uma seção ausente/parcial no banco (banco novo, migração pela metade)
 * nunca devolve `undefined` para campos como `about.specialties`.
 */
function section<K extends keyof SiteSettings>(key: K): SiteSettings[K] {
  const name = key as string;
  const base = (DEFAULT_SETTINGS[name] ?? {}) as Record<string, unknown>;
  const stored = getSetting<Record<string, unknown>>(name, {});
  return { ...base, ...(stored ?? {}) } as SiteSettings[K];
}

export function getSiteSettings(): SiteSettings {
  return {
    site: section("site"),
    hero: section("hero"),
    about: section("about"),
    seo: section("seo"),
    fee: section("fee"),
    notifications: section("notifications"),
    // Pagamento já vem com os dados do studio (CNPJ/chave PIX/Nubank)
    // mesmo antes da Beatriz salvar alguma vez no painel.
    payment: getSetting(
      "payment",
      DEFAULT_SETTINGS.payment as PaymentSettings
    ),
  };
}

/* ------------------------------- serviços ------------------------------- */

export function listServices(onlyActive = false): Service[] {
  const db = getDb();
  const sql = onlyActive
    ? "SELECT * FROM services WHERE status = 'active' ORDER BY sort_order, id"
    : "SELECT * FROM services ORDER BY sort_order, id";
  return plainRows<Service>(db.prepare(sql).all());
}

export function getService(id: number): Service | undefined {
  return plainRow<Service>(
    getDb().prepare("SELECT * FROM services WHERE id = ?").get(id)
  );
}

/* ------------------------------ promoções ------------------------------- */

export function listPromotions(onlyActive = false): Promotion[] {
  const db = getDb();
  const sql = onlyActive
    ? "SELECT * FROM promotions WHERE active = 'active' ORDER BY sort_order, id"
    : "SELECT * FROM promotions ORDER BY sort_order, id";
  const rows = plainRows<Promotion>(db.prepare(sql).all());
  if (!onlyActive) return rows;

  const today = new Date().toISOString().slice(0, 10);
  return rows.filter((p) => {
    if (p.start_date && p.start_date > today) return false;
    if (p.end_date && p.end_date < today) return false;
    return true;
  });
}

/* -------------------------------- galeria ------------------------------- */

export function listGallery(onlyActive = false): GalleryItem[] {
  const db = getDb();
  const sql = onlyActive
    ? "SELECT * FROM gallery WHERE active = 'active' ORDER BY sort_order, id"
    : "SELECT * FROM gallery ORDER BY sort_order, id";
  return plainRows<GalleryItem>(db.prepare(sql).all());
}

/* ----------------------------- depoimentos ------------------------------ */

export function listTestimonials(onlyActive = false): Testimonial[] {
  const db = getDb();
  const sql = onlyActive
    ? "SELECT * FROM testimonials WHERE active = 'active' ORDER BY sort_order, id"
    : "SELECT * FROM testimonials ORDER BY sort_order, id";
  return plainRows<Testimonial>(db.prepare(sql).all());
}

/* -------------------------------- agenda -------------------------------- */

export function listWorkingHours(): WorkingHours[] {
  const rows = plainRows<Omit<WorkingHours, "closed"> & { closed: number }>(
    getDb().prepare("SELECT * FROM working_hours ORDER BY weekday").all()
  );
  return rows.map((r) => ({ ...r, closed: Number(r.closed) === 1 }));
}

export function listBlocks(date?: string): Block[] {
  const db = getDb();
  if (date) {
    return plainRows<Block>(
      db.prepare("SELECT * FROM blocks WHERE date = ? ORDER BY start_time").all(date)
    );
  }
  return plainRows<Block>(
    db.prepare("SELECT * FROM blocks ORDER BY date, start_time").all()
  );
}

/**
 * Horários ocupados de uma data: agendamentos reservados e bloqueios manuais.
 */
export function busyTimesFor(date: string): {
  times: string[];
  blocked: Block[];
} {
  const db = getDb();
  const appts = plainRows<{ time: string }>(
    db
      .prepare(
        `SELECT time FROM appointments
         WHERE date = ? AND status IN ('pending','approved','confirmed','completed')
           AND (payment_status IN ('waiting','paid')
                OR (payment_status = 'pending'
                    AND created_at >= datetime('now', '-30 minutes')))
         ORDER BY time`
      )
      .all(date)
  );

  return { times: appts.map((a) => a.time), blocked: listBlocks(date) };
}

export function busyIntervalsFor(
  date: string,
  excludeId?: number
): { start: number; end: number }[] {
  const db = getDb();
  const params: (string | number)[] = excludeId ? [date, excludeId] : [date];

  const rows = plainRows<{ id: number; time: string; duration_min: number }>(
    db
      .prepare(
        `SELECT a.id AS id, a.time AS time, s.duration_min AS duration_min
         FROM appointments a
         JOIN services s ON s.id = a.service_id
         WHERE a.date = ?
           AND a.status IN ('pending','approved','confirmed','completed')
           AND (a.payment_status IN ('waiting','paid')
                OR (a.payment_status = 'pending'
                    AND a.created_at >= datetime('now', '-30 minutes')))
           ${excludeId ? "AND a.id <> ?" : ""}`
      )
      .all(...params)
  );

  return rows.map((r) => {
    const [h, m] = r.time.split(":").map(Number);
    const start = (h || 0) * 60 + (m || 0);
    return { start, end: start + (r.duration_min || 60) };
  });
}

export function listAppointments(filter?: {
  from?: string;
  to?: string;
  status?: string;
}): AppointmentWithRelations[] {
  const db = getDb();
  const where: string[] = [];
  const params: (string | number)[] = [];

  if (filter?.from) {
    where.push("a.date >= ?");
    params.push(filter.from);
  }
  if (filter?.to) {
    where.push("a.date <= ?");
    params.push(filter.to);
  }
  if (filter?.status) {
    where.push("a.status = ?");
    params.push(filter.status);
  }

  const sql = `
    SELECT a.*,
           c.name  AS client_name,
           c.whatsapp AS client_whatsapp,
           c.email AS client_email,
           s.name  AS service_name,
           s.duration_min AS service_duration_min,
           s.track AS service_track
    FROM appointments a
    JOIN clients c ON c.id = a.client_id
    JOIN services s ON s.id = a.service_id
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY a.date ASC, a.time ASC
  `;
  return plainRows<AppointmentWithRelations>(
    db.prepare(sql).all(...params)
  );
}
