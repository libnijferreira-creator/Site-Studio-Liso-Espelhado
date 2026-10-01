import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";
import { DEFAULT_SETTINGS, DEFAULT_SERVICES, EXTRA_SERVICES, DEFAULT_WORKING_HOURS, DEFAULT_PROMOTIONS, DEFAULT_GALLERY, DEFAULT_TESTIMONIALS } from "./defaults";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "studio.db");

const SCHEMA = `
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS services (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  price_cents  INTEGER NOT NULL DEFAULT 0,
  duration_min INTEGER NOT NULL DEFAULT 60,
  image        TEXT,
  category     TEXT NOT NULL DEFAULT 'Tratamentos',
  track        TEXT NOT NULL DEFAULT 'hair',
  status       TEXT NOT NULL DEFAULT 'active',
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS clients (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  whatsapp   TEXT NOT NULL,
  email      TEXT,
  cpf        TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS appointments (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  code            TEXT NOT NULL UNIQUE,
  client_id       INTEGER NOT NULL REFERENCES clients(id),
  service_id      INTEGER NOT NULL REFERENCES services(id),
  date            TEXT NOT NULL,
  time            TEXT NOT NULL,
  total_cents     INTEGER NOT NULL,
  fee_cents       INTEGER NOT NULL,
  remainder_cents INTEGER NOT NULL,
  hair_size       TEXT,
  hair_size_cents INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'pending',
  payment_status  TEXT NOT NULL DEFAULT 'pending',
  payment_method  TEXT,
  transaction_id  TEXT,
  notes           TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT
);
CREATE INDEX IF NOT EXISTS idx_appt_date ON appointments(date, time);
CREATE INDEX IF NOT EXISTS idx_appt_status ON appointments(status);

CREATE TABLE IF NOT EXISTS blocks (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  date       TEXT NOT NULL,
  start_time TEXT,
  end_time   TEXT,
  reason     TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_blocks_date ON blocks(date);

CREATE TABLE IF NOT EXISTS promotions (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  title                TEXT NOT NULL,
  description          TEXT NOT NULL DEFAULT '',
  image                TEXT,
  original_price_cents INTEGER NOT NULL DEFAULT 0,
  promo_price_cents    INTEGER NOT NULL DEFAULT 0,
  start_date           TEXT,
  end_date             TEXT,
  cta_label            TEXT NOT NULL DEFAULT 'APROVEITAR PROMOÇÃO',
  service_id           INTEGER REFERENCES services(id),
  active               TEXT NOT NULL DEFAULT 'active',
  sort_order           INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS gallery (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT NOT NULL DEFAULT '',
  caption    TEXT,
  image      TEXT,
  video_url  TEXT,
  media_type TEXT NOT NULL DEFAULT 'image',
  kind       TEXT NOT NULL DEFAULT 'trabalho',
  active     TEXT NOT NULL DEFAULT 'active',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS testimonials (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  photo      TEXT,
  text       TEXT NOT NULL,
  rating     INTEGER NOT NULL DEFAULT 5,
  date       TEXT,
  active     TEXT NOT NULL DEFAULT 'active',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS working_hours (
  weekday    INTEGER PRIMARY KEY,
  open_time  TEXT NOT NULL DEFAULT '09:00',
  close_time TEXT NOT NULL DEFAULT '19:00',
  closed     INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS admins (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  salt          TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  admin_id   INTEGER NOT NULL REFERENCES admins(id),
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  appointment_id INTEGER REFERENCES appointments(id),
  kind           TEXT NOT NULL DEFAULT 'booking',
  phone          TEXT NOT NULL,
  message        TEXT NOT NULL,
  wa_link        TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending',
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  read_at        TEXT
);
CREATE INDEX IF NOT EXISTS idx_notif_status ON notifications(status, created_at);
`;

/** Hash com salt no mesmo formato do seed (scrypt, 64 bytes). */
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = randomBytes(16).toString("hex");
  return { hash: scryptSync(password, salt, 64).toString("hex"), salt };
}

function ensureAdmin(db: DatabaseSync) {
  const row = db.prepare("SELECT COUNT(*) AS n FROM admins").get() as {
    n: number;
  };
  if (row.n > 0) return;

  const username = process.env.ADMIN_USER || "admin";
  const password = process.env.ADMIN_PASSWORD || "studio2026";
  const { hash, salt } = hashPassword(password);
  db.prepare(
    "INSERT INTO admins (username, password_hash, salt) VALUES (?, ?, ?)"
  ).run(username, hash, salt);
}

function seed(db: DatabaseSync) {
  const count = (table: string) =>
    (db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number })
      .n;

  if (count("settings") === 0) {
    const stmt = db.prepare(
      "INSERT INTO settings (key, value) VALUES (?, ?)"
    );
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      stmt.run(key, JSON.stringify(value));
    }
  }

  if (count("working_hours") === 0) {
    const stmt = db.prepare(
      "INSERT INTO working_hours (weekday, open_time, close_time, closed) VALUES (?, ?, ?, ?)"
    );
    for (const h of DEFAULT_WORKING_HOURS) {
      stmt.run(h.weekday, h.open_time, h.close_time, h.closed ? 1 : 0);
    }
  }

  if (count("services") === 0) {
    const stmt = db.prepare(
      `INSERT INTO services (name, description, price_cents, duration_min, image, category, track, status, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)`
    );
    // Banco novo: só os de cabelo (unhas entram no bloco de `nails_seeded` e
    // os extras no de `extras_seeded`) — senão os serviços de unha duplicavam.
    DEFAULT_SERVICES.filter((s) => s.track !== "nails").forEach((s, i) =>
      stmt.run(s.name, s.description, s.price_cents, s.duration_min, null, s.category, s.track ?? "hair", i)
    );
  }

  // Serviços de unha: inseridos uma única vez em bancos já existentes.
  const nailsSeeded = db
    .prepare("SELECT COUNT(*) AS n FROM settings WHERE key = 'nails_seeded'")
    .get() as { n: number };
  if (nailsSeeded.n === 0 && count("services") > 0) {
    const nails = DEFAULT_SERVICES.filter((s) => s.track === "nails");
    const stmt = db.prepare(
      `INSERT INTO services (name, description, price_cents, duration_min, image, category, track, status, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)`
    );
    nails.forEach((s, i) =>
      stmt.run(s.name, s.description, s.price_cents, s.duration_min, null, s.category, s.track ?? "nails", 100 + i)
    );
    db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run(
      "nails_seeded",
      JSON.stringify(true)
    );
  }

  // Serviços extras (alisamento, cronograma, escovagem, coloração,
  // sobrancelhas): acrescentados depois do primeiro release, então bancos já
  // existentes não os têm. Só insere os que faltam (pelo nome) e marca a
  // settings para não repetir — renomear/excluir no painel não repõe nada.
  const extrasSeeded = db
    .prepare("SELECT COUNT(*) AS n FROM settings WHERE key = 'extras_seeded'")
    .get() as { n: number };
  if (extrasSeeded.n === 0) {
    const existe = db.prepare("SELECT COUNT(*) AS n FROM services WHERE name = ?");
    const stmt = db.prepare(
      `INSERT INTO services (name, description, price_cents, duration_min, image, category, track, status, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)`
    );
    EXTRA_SERVICES.forEach((s, i) => {
      const mesmo = existe.get(s.name) as { n: number };
      if (mesmo.n === 0) {
        stmt.run(s.name, s.description, s.price_cents, s.duration_min, null, s.category, s.track ?? "hair", 6 + i);
      }
    });
    db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run(
      "extras_seeded",
      JSON.stringify(true)
    );
  }

  if (count("promotions") === 0) {
    const stmt = db.prepare(
      `INSERT INTO promotions (title, description, image, original_price_cents, promo_price_cents,
        start_date, end_date, cta_label, active, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`
    );
    DEFAULT_PROMOTIONS.forEach((p, i) =>
      stmt.run(
        p.title, p.description, null, p.original_price_cents, p.promo_price_cents,
        p.start_date, p.end_date, p.cta_label, i
      )
    );
  }

  if (count("gallery") === 0) {
    const stmt = db.prepare(
      `INSERT INTO gallery (title, caption, image, media_type, kind, active, sort_order)
       VALUES (?, ?, ?, ?, ?, 'active', ?)`
    );
    DEFAULT_GALLERY.forEach((g, i) =>
      stmt.run(g.title, g.caption, null, g.media_type, g.kind, i)
    );
  }

  if (count("testimonials") === 0) {
    const stmt = db.prepare(
      `INSERT INTO testimonials (name, photo, text, rating, date, active, sort_order)
       VALUES (?, ?, ?, ?, ?, 'active', ?)`
    );
    DEFAULT_TESTIMONIALS.forEach((t, i) =>
      stmt.run(t.name, null, t.text, t.rating, t.date, i)
    );
  }

  ensureAdmin(db);
}

declare global {
  // eslint-disable-next-line no-var
  var __studioDb: DatabaseSync | undefined;
}

export function getDb(): DatabaseSync {
  if (globalThis.__studioDb) return globalThis.__studioDb;

  fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec(SCHEMA);
  migrate(db);
  seed(db);
  globalThis.__studioDb = db;
  return db;
}

/** Adiciona colunas novas em bancos criados por versões anteriores. */
function migrate(db: DatabaseSync) {
  const cols = db.prepare("PRAGMA table_info(gallery)").all() as unknown as {
    name: string;
  }[];
  const names = cols.map((c) => c.name);

  if (!names.includes("media_type")) {
    db.exec("ALTER TABLE gallery ADD COLUMN media_type TEXT NOT NULL DEFAULT 'image'");
  }
  if (!names.includes("video_url")) {
    db.exec("ALTER TABLE gallery ADD COLUMN video_url TEXT");
  }

  // Trilha do serviço: 'hair' (cabelo) ou 'nails' (unha) — controla as quartas.
  const svcCols = db
    .prepare("PRAGMA table_info(services)")
    .all() as unknown as { name: string }[];
  if (!svcCols.some((c) => c.name === "track")) {
    db.exec("ALTER TABLE services ADD COLUMN track TEXT NOT NULL DEFAULT 'hair'");
  }

  // Regra de agenda: dia da semana dedicado às unhas.
  const hasSchedule = db
    .prepare("SELECT COUNT(*) AS n FROM settings WHERE key = 'schedule'")
    .get() as { n: number };
  if (hasSchedule.n === 0) {
    db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run(
      "schedule",
      JSON.stringify(DEFAULT_SETTINGS.schedule)
    );
  }

  // Tamanho do cabelo: colunas do registro + opções padrão no painel.
  const apptCols = db
    .prepare("PRAGMA table_info(appointments)")
    .all() as unknown as { name: string }[];
  if (!apptCols.some((c) => c.name === "hair_size")) {
    db.exec("ALTER TABLE appointments ADD COLUMN hair_size TEXT");
  }
  if (!apptCols.some((c) => c.name === "hair_size_cents")) {
    db.exec(
      "ALTER TABLE appointments ADD COLUMN hair_size_cents INTEGER NOT NULL DEFAULT 0"
    );
  }
  const hasSizes = db
    .prepare("SELECT COUNT(*) AS n FROM settings WHERE key = 'hairSizes'")
    .get() as { n: number };
  if (hasSizes.n === 0) {
    db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run(
      "hairSizes",
      JSON.stringify(DEFAULT_SETTINGS.hairSizes)
    );
  }
}

/**
 * O node:sqlite devolve linhas com prototype nulo, que o Next.js se recusa a
 * serializar ao Client Component. `plainRows` converte para objetos comuns.
 */
export function plainRows<T>(rows: unknown[]): T[] {
  return rows.map((r) => ({ ...(r as object) }) as T);
}

export function plainRow<T>(row: unknown): T | undefined {
  if (row === undefined || row === null) return undefined;
  return { ...(row as object) } as T;
}

/* ------------------------------- settings ------------------------------- */

export function getSetting<T>(key: string, fallback: T): T {
  const row = getDb()
    .prepare("SELECT value FROM settings WHERE key = ?")
    .get(key) as { value: string } | undefined;
  if (!row) return fallback;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return fallback;
  }
}

export function setSetting(key: string, value: unknown): void {
  getDb()
    .prepare(
      `INSERT INTO settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    )
    .run(key, JSON.stringify(value));
}

export function getAllSettings(): Record<string, unknown> {
  const rows = getDb()
    .prepare("SELECT key, value FROM settings")
    .all() as { key: string; value: string }[];
  const out: Record<string, unknown> = {};
  for (const r of rows) {
    try {
      out[r.key] = JSON.parse(r.value);
    } catch {
      out[r.key] = r.value;
    }
  }
  return out;
}

/* --------------------------------- auth --------------------------------- */

export function verifyAdmin(
  username: string,
  password: string
): { id: number; username: string } | null {
  const row = getDb()
    .prepare("SELECT id, username, password_hash, salt FROM admins WHERE username = ?")
    .get(username) as
    | { id: number; username: string; password_hash: string; salt: string }
    | undefined;
  if (!row) return null;
  const hash = scryptSync(password, row.salt, 64);
  const expected = Buffer.from(row.password_hash, "hex");
  if (expected.length !== hash.length) return null;
  if (!timingSafeEqual(hash, expected)) return null;
  return { id: row.id, username: row.username };
}

export function createSession(adminId: number): string {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
  getDb()
    .prepare("INSERT INTO sessions (token, admin_id, expires_at) VALUES (?, ?, ?)")
    .run(token, adminId, expires);
  return token;
}

export function getSessionAdmin(token: string | undefined): { id: number; username: string } | null {
  if (!token) return null;
  const row = getDb()
    .prepare(
      `SELECT a.id AS id, a.username AS username, s.expires_at AS expires_at
       FROM sessions s JOIN admins a ON a.id = s.admin_id
       WHERE s.token = ?`
    )
    .get(token) as
    | { id: number; username: string; expires_at: string }
    | undefined;
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    getDb().prepare("DELETE FROM sessions WHERE token = ?").run(token);
    return null;
  }
  return { id: row.id, username: row.username };
}

export function destroySession(token: string | undefined) {
  if (!token) return;
  getDb().prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

/* --------------------------- usuários do painel --------------------------- */

export type AdminRow = { id: number; username: string; created_at: string };

/** Regras de usuário/senha — devolve a mensagem de erro ou null se ok. */
export function validateNewCredentials(
  username: string,
  password: string
): string | null {
  const u = username.trim();
  if (u.length < 3) return "O usuário precisa ter pelo menos 3 caracteres.";
  if (!/^[a-zA-Z0-9._-]+$/.test(u)) {
    return "Use apenas letras, números, ponto, hífen ou sublinhado.";
  }
  if (password.length < 8) return "A senha precisa ter pelo menos 8 caracteres.";
  return null;
}

export function listAdmins(): AdminRow[] {
  return plainRows<AdminRow>(
    getDb()
      .prepare("SELECT id, username, created_at FROM admins ORDER BY id")
      .all()
  );
}

/** Cria um novo login. O usuário é normalizado para minúsculas. */
export function createAdmin(
  username: string,
  password: string
): { ok: boolean; error?: string } {
  const u = username.trim().toLowerCase();
  const invalid = validateNewCredentials(u, password);
  if (invalid) return { ok: false, error: invalid };

  const db = getDb();
  const taken = db
    .prepare("SELECT COUNT(*) AS n FROM admins WHERE username = ?")
    .get(u) as { n: number };
  if (taken.n > 0) return { ok: false, error: "Esse usuário já existe." };

  const { hash, salt } = hashPassword(password);
  db.prepare(
    "INSERT INTO admins (username, password_hash, salt) VALUES (?, ?, ?)"
  ).run(u, hash, salt);
  return { ok: true };
}

/** Troca a senha de um login (as sessões abertas continuam válidas). */
export function setAdminPassword(
  id: number,
  password: string
): { ok: boolean; error?: string } {
  if (password.length < 8) {
    return { ok: false, error: "A senha precisa ter pelo menos 8 caracteres." };
  }
  const { hash, salt } = hashPassword(password);
  const info = getDb()
    .prepare("UPDATE admins SET password_hash = ?, salt = ? WHERE id = ?")
    .run(hash, salt, id);
  if (Number(info.changes) === 0) {
    return { ok: false, error: "Usuário não encontrado." };
  }
  return { ok: true };
}

/**
 * Exclui um login e as sessões dele.
 * Proteções: não dá para excluir a si mesmo nem o último usuário.
 */
export function removeAdmin(
  id: number,
  currentAdminId: number
): { ok: boolean; error?: string } {
  if (id === currentAdminId) {
    return { ok: false, error: "Você não pode excluir o seu próprio usuário." };
  }
  const db = getDb();
  const total = db.prepare("SELECT COUNT(*) AS n FROM admins").get() as {
    n: number;
  };
  if (total.n <= 1) {
    return { ok: false, error: "Não é possível excluir o último usuário." };
  }

  db.prepare("DELETE FROM sessions WHERE admin_id = ?").run(id);
  const info = db.prepare("DELETE FROM admins WHERE id = ?").run(id);
  if (Number(info.changes) === 0) {
    return { ok: false, error: "Usuário não encontrado." };
  }
  return { ok: true };
}
