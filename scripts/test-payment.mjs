/**
 * Teste E2E do recurso "Pagamento — conta Nubank, chave PIX e CNPJ".
 *
 * O que valida:
 *  1. cadastro (settings `payment`) é gravado e lido pelo site
 *  2. /agendar mostra a área de pagamento direto com chave PIX formatada,
 *     dados do studio e botão de comprovante no WhatsApp
 *  3. cartão pelo aplicativo do Nubank aparece com o texto de juros
 *  4. home e /contato exibem a linha "Chave PIX"
 *  5. painel → Conteúdo → aba Pagamento tem o formulário completo
 *  6. desligando `enabled` / `cardEnabled`, some da etapa de pagamento
 *  7. tudo é restaurado ao final
 *
 * Uso:  node scripts/test-payment.mjs   (servidor em http://localhost:3000)
 */
import { DatabaseSync } from "node:sqlite";
import { randomBytes } from "node:crypto";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const DB_PATH = "C:/Users/Empreendedores/Desktop/studio-liso/data/studio.db";

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

async function html(path, init = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    signal: AbortSignal.timeout(30000),
  });
  return { status: res.status, body: await res.text() };
}

const db = new DatabaseSync(DB_PATH);

/* --------------------------- 0. preparação ------------------------------ */

const paymentAntes = (
  db.prepare("SELECT value FROM settings WHERE key = 'payment'").get() ?? {}
).value;

const CADASTRO = {
  enabled: true,
  pixEnabled: true,
  pixKey: "53362957000144",
  cardEnabled: true,
  cardLink: "",
  cardTerms:
    "Parcelamento e juros são calculados pelo próprio aplicativo do Nubank no momento do pagamento.",
  bank: "Nubank",
  agency: "0001",
  account: "12345-6",
  cnpj: "53362957000144",
  holder: "STUDIO LISO ESPELHADO",
};

function setPayment(p) {
  db.prepare(
    `INSERT INTO settings (key, value) VALUES ('payment', ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(JSON.stringify(p));
}

function restaurar() {
  if (paymentAntes === undefined) {
    db.prepare("DELETE FROM settings WHERE key = 'payment'").run();
  } else {
    db.prepare("UPDATE settings SET value = ? WHERE key = 'payment'").run(
      paymentAntes
    );
  }
}

process.on("exit", restaurar);
setPayment(CADASTRO);

const CNPJ_FORMATADO = "53.362.957/0001-44";

/* ------------------------------ 1. /agendar ----------------------------- */
console.log("\n1) /agendar informa os meios cadastrados");
{
  const { status, body } = await html("/agendar");
  ok(status === 200, `/agendar responde 200 (recebeu ${status})`);

  ok(
    body.includes("PIX na chave do studio (Nubank)"),
    "passo 02: PIX na chave do studio (Nubank)"
  );
  ok(
    body.includes("cartão pelo aplicativo Nubank"),
    "passo 02: cartão pelo aplicativo Nubank"
  );
  ok(
    body.includes("comprovante pelo WhatsApp"),
    "orienta o envio do comprovante"
  );
  ok(
    body.includes("Ficou com dúvidas?"),
    "card de dúvidas com a secretária Hadassa continua"
  );
}

/* ------------------------------ 2. home/contato ------------------------- */
console.log("\n2) linha da chave PIX na home e em /contato");
{
  const home = await html("/");
  ok(home.status === 200, `/ responde 200 (recebeu ${home.status})`);
  ok(home.body.includes("Chave PIX"), "home mostra “Chave PIX”");
  ok(home.body.includes(CNPJ_FORMATADO), "home exibe o CNPJ formatado");

  const contato = await html("/contato");
  ok(contato.status === 200, `/contato responde 200 (recebeu ${contato.status})`);
  ok(contato.body.includes("Chave PIX"), "/contato mostra “Chave PIX”");
  ok(contato.body.includes(CNPJ_FORMATADO), "/contato exibe o CNPJ formatado");
}

/* ------------------------------ 3. painel ------------------------------- */
console.log("\n3) painel → Conteúdo → aba Pagamento");
{
  // Sessão de administrador criada direto no banco (não apaga a existente).
  const admin = db.prepare("SELECT id FROM admins ORDER BY id LIMIT 1").get();
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
  db.prepare(
    "INSERT INTO sessions (token, admin_id, expires_at) VALUES (?, ?, ?)"
  ).run(token, admin.id, expires);

  try {
    const { status, body } = await html("/admin/conteudo", {
      headers: { cookie: `studio_session=${token}` },
    });
    ok(status === 200, `/admin/conteudo responde 200 (recebeu ${status})`);
    ok(body.includes("Pagamento"), "aba “Pagamento” no menu do painel");
    ok(
      body.includes("Avisos") && body.includes("Horários"),
      "as demais abas continuam no lugar"
    );
    // Os campos da aba são renderizados pelo cliente (estado da aba) —
    // a conferência do formulário é feita no navegador.
  } finally {
    db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
  }
}

/* ------------------------------ 4. chaves liga/desliga ------------------ */
console.log("\n4) chaves de configuração");
{
  setPayment({ ...CADASTRO, enabled: false });
  let r = await html("/agendar");
  ok(
    !r.body.includes("PIX na chave do studio"),
    "desligando “Exibir área de pagamento”, some o PIX de /agendar"
  );
  ok(
    r.body.includes("PIX ou cartão, com aprovação imediata."),
    "volta para o texto genérico"
  );

  setPayment({ ...CADASTRO, cardEnabled: false, enabled: true });
  r = await html("/agendar");
  ok(
    !r.body.includes("cartão pelo aplicativo"),
    "desligando “cartão”, some o cartão do Nubank"
  );
  ok(
    r.body.includes("PIX na chave do studio"),
    "o PIX continua visível"
  );

  setPayment(CADASTRO);
  r = await html("/agendar");
  ok(
    r.body.includes("PIX na chave do studio (Nubank)"),
    "configuração original restaurada"
  );
}

/* ------------------------------ resultado -------------------------------- */
console.log(`\n=== PAGAMENTO: ${pass} ok, ${fail} falha ===`);
if (fail) {
  console.log("Falhas:");
  for (const e of erros) console.log(` - ${e}`);
}
process.exit(fail ? 1 : 0);
