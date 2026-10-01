/**
 * Testa a regra de agenda: unha somente às quartas e cabelo bloqueado na quarta.
 * Uso: node scripts/test-nail-rule.mjs [baseUrl]
 */
import { DatabaseSync } from "node:sqlite";

const BASE = process.argv[2] || "http://localhost:3000";
const db = new DatabaseSync(
  "C:/Users/Empreendedores/Desktop/studio-liso/data/studio.db",
  { readOnly: true }
);

const cols = db.prepare("PRAGMA table_info(services)").all().map((c) => c.name);
console.log("services.track presente:", cols.includes("track"));

const services = db
  .prepare("SELECT id, name, duration_min, track FROM services ORDER BY id")
  .all();
console.table(services);

const nails = services.filter((s) => s.track === "nails");
const hair = services.filter((s) => s.track === "hair");
if (!nails.length) throw new Error("Nenhum serviço de unha encontrado.");
if (!hair.length) throw new Error("Nenhum serviço de cabelo encontrado.");

// 2026-10-07 = quarta-feira | 2026-10-08 = quinta-feira
const wed = "2026-10-07";
const thu = "2026-10-08";

const checks = [];

async function check(label, service, date, expectClosed) {
  const url = `${BASE}/api/booking/availability?serviceId=${service.id}&date=${date}`;
  const res = await fetch(url);
  const body = await res.json();
  const closed = Boolean(body.closed);
  const ok = closed === expectClosed;
  checks.push(ok);
  console.log(
    `${ok ? "OK  " : "FAIL"} | ${label} | serviço=${service.name} | data=${date} (${weekdayName(
      date
    )}) | fechado=${closed} | motivo=${body.reason ?? "-"} | slots=${
      body.slots?.length ?? 0
    }`
  );
}

function weekdayName(date) {
  return [
    "dom",
    "seg",
    "ter",
    "qua",
    "qui",
    "sex",
    "sab",
  ][new Date(`${date}T12:00:00`).getDay()];
}

await check("UNHA na quarta (permitido)", nails[0], wed, false);
await check("UNHA na quinta (bloqueado)", nails[0], thu, true);
await check("CABELO na quinta (permitido)", hair[0], thu, false);
await check("CABELO na quarta (bloqueado)", hair[0], wed, true);

console.log(
  `\n${checks.every(Boolean) ? "REGRA OK — todos os cenários passaram." : "REGRA FALHOU."}`
);
process.exitCode = checks.every(Boolean) ? 0 : 1;
try {
  db.close();
} catch {
  /* ignora */
}
