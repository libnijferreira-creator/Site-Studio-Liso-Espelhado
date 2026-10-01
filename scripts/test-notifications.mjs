/**
 * Teste E2E do recurso "Avisos de agendamento" (celulares do admin).
 *
 * O que valida:
 *  1. nova reserva gera UM aviso por celular cadastrado (kind = booking)
 *  2. a mensagem traz código, cliente, data, taxa 15% e restante + link wa.me
 *  3. aprovação do pagamento gera os avisos de CONFIRMAÇÃO (kind = confirmed)
 *  4. com o checkbox de aviso desligado, nada é gerado
 *  5. tudo é apagado ao final (dados de teste)
 *
 * Uso:  node scripts/test-notifications.mjs   (servidor em http://localhost:3000)
 */
import { DatabaseSync } from "node:sqlite";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const DB_PATH = "C:/Users/Empreendedores/Desktop/studio-liso/data/studio.db";
const TEST_NAME = "Teste Aviso";
const PHONES = ["(24) 98153-1771", "(24) 99999-0000"];

let pass = 0;
let fail = 0;
const erros = [];

function ok(cond, label, detalhe = "") {
  if (cond) {
    pass++;
    console.log(`  ✔ ${label}`);
  } else {
    fail++;
    erros.push(`${label}${detalhe ? ` — ${detalhe}` : ""}`);
    console.log(`  ✘ ${label}${detalhe ? ` — ${detalhe}` : ""}`);
  }
}

async function rota(path, init = {}, tentativas = 12) {
  let ultimo;
  for (let i = 0; i < tentativas; i++) {
    try {
      const res = await fetch(`${BASE}${path}`, {
        ...init,
        signal: AbortSignal.timeout(30000),
      });
      return res;
    } catch (e) {
      ultimo = e;
      await new Promise((r) => setTimeout(r, 2500));
    }
  }
  throw ultimo;
}

const db = new DatabaseSync(DB_PATH);

/* --------------------------- 0. preparação ------------------------------ */

const notificationsAntes = (
  db.prepare("SELECT value FROM settings WHERE key = 'notifications'").get() ?? {}
).value;

db.prepare(
  `INSERT INTO settings (key, value) VALUES ('notifications', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
).run(
  JSON.stringify({
    studioPhone: PHONES[0],
    studioPhones: PHONES.join("\n"),
    clientEmailEnabled: true,
    studioEmailEnabled: true,
  })
);

function setAvisoLigado(ligado) {
  const atual = JSON.parse(
    db.prepare("SELECT value FROM settings WHERE key = 'notifications'").get().value
  );
  db.prepare("UPDATE settings SET value = ? WHERE key = 'notifications'").run(
    JSON.stringify({ ...atual, studioEmailEnabled: ligado })
  );
}

function avisosDoCodigo(code) {
  return db
    .prepare(
      `SELECT kind, phone, message, wa_link, status
         FROM notifications
        WHERE message LIKE ?
        ORDER BY id`
    )
    .all(`%${code}%`);
}

function limpar() {
  // Avisos referenciam agendamentos por FK → apagar avisos antes.
  const ids = db
    .prepare(
      "SELECT id FROM appointments WHERE client_id IN (SELECT id FROM clients WHERE name = ?)"
    )
    .all(TEST_NAME)
    .map((r) => r.id);
  if (ids.length) {
    const ph = ids.map(() => "?").join(", ");
    db.prepare(`DELETE FROM notifications WHERE appointment_id IN (${ph})`).run(
      ...ids
    );
    db.prepare(`DELETE FROM appointments WHERE id IN (${ph})`).run(...ids);
  }
  db.prepare("DELETE FROM notifications WHERE message LIKE ?").run(
    `%${TEST_NAME}%`
  );
  db.prepare(
    `DELETE FROM clients WHERE name = ?
        AND NOT EXISTS (SELECT 1 FROM appointments a WHERE a.client_id = clients.id)`
  ).run(TEST_NAME);
  if (notificationsAntes !== undefined) {
    db.prepare("UPDATE settings SET value = ? WHERE key = 'notifications'").run(
      notificationsAntes
    );
  } else {
    db.prepare("DELETE FROM settings WHERE key = 'notifications'").run();
  }
}

try {
  // Servidor de pé?
  const ping = await rota("/", {}, 20);
  ok(ping.ok, `servidor responde em ${BASE}`);

  // Serviço + data com horário livre (a própria API já respeita regra de unhas).
  const servicos = db
    .prepare("SELECT id, name FROM services WHERE status = 'active' ORDER BY id")
    .all();
  let escolha = null;
  for (let d = 1; d <= 45 && !escolha; d++) {
    const dt = new Date();
    dt.setDate(dt.getDate() + d);
    const iso = dt.toISOString().slice(0, 10);
    for (const s of servicos) {
      const r = await rota(`/api/booking/availability?date=${iso}&serviceId=${s.id}`);
      const data = await r.json();
      if (Array.isArray(data.slots) && data.slots.length > 0) {
        escolha = { date: iso, time: data.slots[0], service: s };
        break;
      }
    }
  }
  ok(!!escolha, "encontrou data/horário livres", escolha ? "" : "em 45 dias");
  if (!escolha) throw new Error("sem horário livre");

  console.log(
    `\n  alvo: ${escolha.service.name} em ${escolha.date} às ${escolha.time}\n`
  );

  /* --------------------- 1. nova reserva → aviso ----------------------- */
  console.log("1) Nova reserva gera aviso para todos os celulares");
  const r1 = await rota("/api/booking", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      serviceId: escolha.service.id,
      date: escolha.date,
      time: escolha.time,
      name: TEST_NAME,
      whatsapp: "24999990003",
      email: "aviso@studio.com",
    }),
  });
  const reserva = await r1.json();
  ok(r1.ok && reserva.code, "reserva criada", JSON.stringify(reserva).slice(0, 160));
  const code = reserva.code || "";

  const avisos1 = avisosDoCodigo(code);
  ok(avisos1.length === PHONES.length, `gerou ${PHONES.length} avisos`, `achou ${avisos1.length}`);
  ok(
    avisos1.every((a) => a.kind === "booking"),
    "tipo do aviso = booking (nova reserva)"
  );
  ok(
    PHONES.every((p) => avisos1.some((a) => a.phone === p)),
    "um aviso para cada celular cadastrado",
    avisos1.map((a) => a.phone).join(", ")
  );
  const msg = avisos1[0]?.message || "";
  ok(msg.includes(code), "mensagem traz o código da reserva");
  ok(/Taxa 15%/.test(msg) && /Restante no studio/.test(msg), "mensagem traz taxa 15% e restante");
  ok(/Ver na agenda/.test(msg), "mensagem traz o link da agenda");
  ok(
    msg.includes("HADASSA") && /secret[áa]ria virtual/i.test(msg),
    "mensagem se identifica como HADASSA, secretária virtual",
    msg.split("\n")[2]?.slice(0, 80)
  );
  ok(
    avisos1.every((a) => a.wa_link.startsWith("https://wa.me/55")),
    "link wa.me montado com DDI 55",
    avisos1[0]?.wa_link
  );
  ok(avisos1.every((a) => a.status === "pending"), "avisos entram como não lidos");

  /* ------------------- 2. aprovação → confirmação ---------------------- */
  console.log("\n2) Pagamento aprovado gera aviso de confirmação");
  const r2 = await rota("/api/booking/approve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  const aprov = await r2.json();
  ok(r2.ok && aprov.ok, "pagamento aprovado (sandbox)", JSON.stringify(aprov).slice(0, 160));

  const avisos2 = avisosDoCodigo(code);
  const confirmados = avisos2.filter((a) => a.kind === "confirmed");
  ok(
    confirmados.length === PHONES.length,
    `+${PHONES.length} avisos de confirmação`,
    `total ${avisos2.length}`
  );
  ok(
    /PAGAMENTO APROVADO|CONFIRMADA/.test(confirmados[0]?.message || ""),
    "mensagem de confirmação identifica o pagamento",
    (confirmados[0]?.message || "").split("\n")[0]
  );
  ok(
    /HADASSA/.test(confirmados[0]?.message || ""),
    "confirmação também se apresenta como a secretária virtual HADASSA",
    (confirmados[0]?.message || "").split("\n")[2]?.slice(0, 80)
  );
  ok(
    avisos2.length === PHONES.length * 2,
    `total esperado = ${PHONES.length * 2} avisos`,
    `achou ${avisos2.length}`
  );

  /* ------------------- 3. checkbox desligado --------------------------- */
  console.log("\n3) Com o aviso ao studio desligado, nada é gerado");
  setAvisoLigado(false);

  let escolha2 = null;
  for (let d = 1; d <= 45 && !escolha2; d++) {
    const dt = new Date();
    dt.setDate(dt.getDate() + d);
    const iso = dt.toISOString().slice(0, 10);
    if (iso === escolha.date) continue;
    for (const s of servicos) {
      const r = await rota(`/api/booking/availability?date=${iso}&serviceId=${s.id}`);
      const data = await r.json();
      const horarios = (data.slots || []).filter((h) => h !== escolha.time);
      if (horarios.length > 0) {
        escolha2 = { date: iso, time: horarios[0], service: s };
        break;
      }
    }
  }
  ok(!!escolha2, "segunda data/horário livre encontrada");

  if (escolha2) {
    const r3 = await rota("/api/booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId: escolha2.service.id,
        date: escolha2.date,
        time: escolha2.time,
        name: TEST_NAME,
        whatsapp: "24999990003",
      }),
    });
    const r3data = await r3.json();
    const avisos3 = r3data.code ? avisosDoCodigo(r3data.code) : [];
    ok(r3.ok && r3data.code, "reserva criada mesmo com aviso desligado");
    ok(avisos3.length === 0, "nenhum aviso gerado", `achou ${avisos3.length}`);
  }

  setAvisoLigado(true);
} catch (e) {
  fail++;
  erros.push(String(e?.message || e));
  console.error("\nERRO:", e);
} finally {
  console.log("\n=== LIMPEZA ===");
  limpar();
  const restantes = db
    .prepare("SELECT COUNT(*) AS n FROM notifications WHERE message LIKE ?")
    .get(`%${TEST_NAME}%`).n;
  const agendamentos = db
    .prepare(
      "SELECT COUNT(*) AS n FROM appointments WHERE client_id IN (SELECT id FROM clients WHERE name = ?)"
    )
    .get(TEST_NAME).n;
  console.log(
    `restantes do teste -> avisos=${restantes} agendamentos=${agendamentos}`
  );
  // Não chama db.close() aqui: no Windows o libuv pode abortar o processo
  // (Assertion failed: UV_HANDLE_CLOSING) ao fechar o handle junto do exit.
}

console.log(`\n=== RESULTADO: ${pass} ok, ${fail} falha ===`);
if (erros.length) erros.forEach((e) => console.log(` - ${e}`));
process.exitCode = fail === 0 ? 0 : 1;
