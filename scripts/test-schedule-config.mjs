/**
 * Prova que a regra de agenda segue a configuração `schedule` do painel:
 * muda o dia de unhas, confere a disponibilidade e restaura o padrão.
 * Uso: node scripts/test-schedule-config.mjs [baseUrl]
 */
const BASE = process.argv[2] || "http://localhost:3000";

const { DatabaseSync } = await import("node:sqlite");
const db = new DatabaseSync(
  "C:/Users/Empreendedores/Desktop/studio-liso/data/studio.db"
);

// Serviços escolhidos no banco — o catálogo é editável pelo painel, então os
// testes não dependem de id fixo.
const { pegarServicos } = await import("./lib-services.mjs");
const { cabelo, unhas } = pegarServicos();
const HAIR = cabelo.id; // serviço de cabelo ativo do catálogo
const NAILS = unhas.id; // serviço de unha ativo do catálogo
const WED = "2026-10-07"; // quarta-feira
const FRI = "2026-10-09"; // sexta-feira

function setSchedule(nailWeekday) {
  db.prepare("UPDATE settings SET value = ? WHERE key = 'schedule'").run(
    JSON.stringify({
      nailWeekday,
      nailWeekdayLabel: [
        "domingo",
        "segunda-feira",
        "terça-feira",
        "quarta-feira",
        "quinta-feira",
        "sexta-feira",
        "sábado",
      ][nailWeekday],
      hairBlockedOnNailDay: true,
    })
  );
}

async function slots(serviceId, date) {
  const res = await fetch(
    `${BASE}/api/booking/availability?serviceId=${serviceId}&date=${date}`
  );
  const body = await res.json();
  return { closed: Boolean(body.closed), n: body.slots?.length ?? 0, reason: body.reason };
}

const results = [];

// Estado A: dia de unhas na QUARTA (padrão)
setSchedule(3);
let r = await slots(HAIR, WED);
results.push(["A1 cabelo/quarta (deve BLOQUEAR)", r.closed === true, r]);
r = await slots(NAILS, WED);
results.push(["A2 unha/quarta (deve ABRIR)", r.closed === false && r.n > 0, r]);
r = await slots(HAIR, FRI);
results.push(["A3 cabelo/sexta (deve ABRIR)", r.closed === false && r.n > 0, r]);

// Estado B: dia de unhas na SEXTA (configuração alterada pelo painel)
setSchedule(5);
r = await slots(HAIR, FRI);
results.push(["B1 cabelo/sexta (deve BLOQUEAR)", r.closed === true, r]);
r = await slots(NAILS, FRI);
results.push(["B2 unha/sexta (deve ABRIR)", r.closed === false && r.n > 0, r]);
r = await slots(HAIR, WED);
results.push(["B3 cabelo/quarta (deve ABRIR)", r.closed === false && r.n > 0, r]);

// Restaura o padrão (quarta-feira)
setSchedule(3);
r = await slots(HAIR, WED);
results.push(["C1 restaurado: cabelo/quarta bloqueado", r.closed === true, r]);

for (const [label, ok, detail] of results) {
  console.log(
    `${ok ? "OK  " : "FAIL"} | ${label} | fechado=${detail.closed} slots=${detail.n} motivo=${detail.reason ?? "-"}`
  );
}

const allOk = results.every(([, ok]) => ok);
console.log(
  `\n${allOk ? "CONFIG OK — a agenda segue o dia de unhas configurado." : "CONFIG FALHOU."}`
);

process.exitCode = allOk ? 0 : 1;
try {
  db.close();
} catch {
  /* ignora */
}
