/**
 * Prova a regra do TAMANHO DO CABELO no servidor:
 *  - serviço de cabelo com hairSize="longo" -> acréscimo somado e taxa sobre o total
 *  - serviço de cabelo sem hairSize         -> cai no primeiro tamanho (Curto, R$ 0)
 *  - serviço de UNHA com hairSize           -> tamanho ignorado (sem acréscimo)
 *  - settings `hairSizes` presentes no banco com 4 tamanhos
 * Uso: node scripts/test-hair-size.mjs [baseUrl]
 */
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { pegarServicos } from "./lib-services.mjs";

const BASE = process.argv[2] || "http://localhost:3000";
// Serviços escolhidos no banco — o catálogo é editável pelo painel, então
// nada aqui depende de id ou preço fixos.
const { cabelo, unhas } = pegarServicos();
const HAIR = cabelo.id;
const NAILS = unhas.id;
const HAIR_PRICE = cabelo.price_cents;
const NAIL_PRICE = unhas.price_cents;
console.log(
  `serviços: cabelo=${cabelo.id} "${cabelo.name}" (${HAIR_PRICE}) · unhas=${unhas.id} "${unhas.name}" (${NAIL_PRICE})`
);
const LONGO = 4000; // acréscimo padrão de "Longo"

const results = [];

function push(label, ok, detail = "") {
  results.push([label, ok, detail]);
}

async function post(pathname, body) {
  const res = await fetch(`${BASE}${pathname}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data };
}

async function slots(serviceId, date) {
  const res = await fetch(
    `${BASE}/api/booking/availability?serviceId=${serviceId}&date=${date}`
  );
  return res.json();
}

function iso(d) {
  return d.toISOString().slice(0, 10);
}

/** Próxima data futura (dia útil da semana certo) com horário livre. */
async function proximaDataLivre(serviceId) {
  const hoje = new Date();
  for (let i = 2; i <= 60; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + i);
    if (d.getDay() === 0 || d.getDay() === 1) continue; // domingo/fechado
    const av = await slots(serviceId, iso(d));
    if (!av.closed && av.slots && av.slots.length >= 3) {
      return { date: iso(d), slots: av.slots };
    }
  }
  return null;
}

function lerBanco() {
  const db = new DatabaseSync(path.join(process.cwd(), "data", "studio.db"));
  return {
    settings: db
      .prepare("SELECT value FROM settings WHERE key = 'hairSizes'")
      .get(),
    porCodigo: (codigo) =>
      db
        .prepare(
          `SELECT hair_size, hair_size_cents, total_cents, fee_cents, remainder_cents
             FROM appointments WHERE code = ?`
        )
        .get(codigo),
    fechar: () => db.close(),
  };
}

/* 0 — settings no banco com os 4 tamanhos */
{
  const banco = lerBanco();
  let cfg = null;
  try {
    cfg = JSON.parse(banco.settings?.value ?? "null");
  } catch {
    cfg = null;
  }
  banco.fechar();
  push(
    "settings hairSizes no banco",
    !!cfg && Array.isArray(cfg.options) && cfg.options.length >= 4,
    cfg ? `opcoes=${cfg.options.map((o) => `${o.id}:${o.price_cents}`).join(",")}` : "ausente"
  );
}

/* 1 — cabelo + tamanho Longo */
let codigoLongo = null;
{
  const grade = await proximaDataLivre(HAIR);
  if (!grade) {
    push("grade de cabelo livre", false, "nenhum dia com 3 horários em 60 dias");
  } else {
    const r = await post("/api/booking", {
      serviceId: HAIR,
      date: grade.date,
      time: grade.slots[0],
      name: "Teste Tamanho",
      whatsapp: "24999990003",
      email: "tamanho@studio.com",
      hairSize: "longo",
    });
    const esperadoTotal = HAIR_PRICE + LONGO;
    const esperadoTaxa = Math.round(esperadoTotal * 0.15);
    push(
      "cabelo + Longo: acréscimo no total",
      r.status < 300 &&
        r.data?.total === esperadoTotal &&
        r.data?.fee === esperadoTaxa &&
        r.data?.remainder === esperadoTotal - esperadoTaxa,
      `status=${r.status} total=${r.data?.total} (esperado ${esperadoTotal}) taxa=${r.data?.fee} (esperado ${esperadoTaxa})`
    );
    push(
      "cabelo + Longo: resposta traz o tamanho",
      r.data?.hairSize === "Longo" && r.data?.hairSizeCents === LONGO,
      `hairSize=${r.data?.hairSize} cents=${r.data?.hairSizeCents}`
    );
    codigoLongo = r.data?.code ?? null;
  }
}

/* 2 — cabelo sem informar tamanho -> primeiro (Curto, R$ 0) */
let codigoCurto = null;
{
  const grade = await proximaDataLivre(HAIR);
  if (grade) {
    const r = await post("/api/booking", {
      serviceId: HAIR,
      date: grade.date,
      time: grade.slots[0],
      name: "Teste Tamanho",
      whatsapp: "24999990003",
      email: "tamanho@studio.com",
    });
    push(
      "cabelo sem tamanho: cai no Curto (R$ 0)",
      r.status < 300 &&
        r.data?.total === HAIR_PRICE &&
        r.data?.hairSize === "Curto",
      `status=${r.status} total=${r.data?.total} hairSize=${r.data?.hairSize}`
    );
    codigoCurto = r.data?.code ?? null;
  } else {
    push("cabelo sem tamanho", false, "sem horário livre");
  }
}

/* 3 — unha com hairSize -> tamanho ignorado */
let codigoUnha = null;
{
  const grade = await proximaDataLivre(NAILS);
  if (grade) {
    const r = await post("/api/booking", {
      serviceId: NAILS,
      date: grade.date,
      time: grade.slots[0],
      name: "Teste Tamanho",
      whatsapp: "24999990003",
      email: "tamanho@studio.com",
      hairSize: "longo",
    });
    push(
      "unha: tamanho ignorado",
      r.status < 300 &&
        r.data?.total === NAIL_PRICE &&
        (r.data?.hairSize === null || r.data?.hairSizeCents === 0),
      `status=${r.status} total=${r.data?.total} hairSize=${r.data?.hairSize}`
    );
    codigoUnha = r.data?.code ?? null;
  } else {
    push("unha com tamanho", false, "sem horário livre");
  }
}

/* 4 — gravação no banco */
{
  const banco = lerBanco();
  const longo = codigoLongo ? banco.porCodigo(codigoLongo) : null;
  const curto = codigoCurto ? banco.porCodigo(codigoCurto) : null;
  const unha = codigoUnha ? banco.porCodigo(codigoUnha) : null;
  banco.fechar();

  push(
    "banco: Longo gravado",
    !!longo &&
      longo.hair_size === "Longo" &&
      longo.hair_size_cents === LONGO &&
      longo.total_cents === HAIR_PRICE + LONGO,
    longo
      ? `hair_size=${longo.hair_size} cents=${longo.hair_size_cents} total=${longo.total_cents}`
      : "reserva não encontrada"
  );
  push(
    "banco: Curto gravado com acréscimo 0",
    !!curto && curto.hair_size === "Curto" && curto.hair_size_cents === 0,
    curto ? `hair_size=${curto.hair_size} cents=${curto.hair_size_cents}` : "-"
  );
  push(
    "banco: unha sem tamanho",
    !!unha && (unha.hair_size === null || unha.hair_size_cents === 0),
    unha ? `hair_size=${unha.hair_size} cents=${unha.hair_size_cents}` : "-"
  );
}

for (const [label, ok, detail] of results) {
  console.log(`${ok ? "OK  " : "FAIL"} | ${label} | ${detail}`);
}
const allOk = results.every(([, ok]) => ok);
console.log(
  `\n${allOk ? "TAMANHOS OK — regra do tamanho aplicada pelo servidor." : "TAMANHOS FALHARAM."}`
);
process.exitCode = allOk ? 0 : 1;
