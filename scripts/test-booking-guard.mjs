/**
 * Prova que a regra do dia de unhas vale no servidor:
 *  - POST /api/booking de CABELO na quarta  -> recusa
 *  - POST /api/booking de UNHA fora da quarta -> recusa
 *  - POST /api/booking de UNHA na quarta -> aceita, paga e confirma
 * Uso: node scripts/test-booking-guard.mjs [baseUrl]
 */
const BASE = process.argv[2] || "http://localhost:3000";

// Serviços escolhidos no banco (catálogo editável pelo painel).
const { pegarServicos } = await import("./lib-services.mjs");
const { cabelo, unhas } = pegarServicos();
const HAIR = cabelo.id;
const NAILS = unhas.id;
const WED = "2026-10-07"; // quarta-feira
const THU = "2026-10-08"; // quinta-feira

const results = [];

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
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

function push(label, ok, detail) {
  results.push([label, ok, detail]);
}

/* 1 — cabelo não pode ser reservado na quarta */
{
  const av = await slots(HAIR, WED);
  push("grade: cabelo/quarta fechada", av.closed === true, av.reason);
  const r = await post("/api/booking", {
    serviceId: HAIR,
    date: WED,
    time: "10:00",
    name: "Teste Guarda",
    whatsapp: "24999990002",
    email: "guarda@studio.com",
  });
  push(
    "POST: cabelo/quarta recusado",
    r.status >= 400,
    `status=${r.status} erro=${r.data?.error ?? "-"}`
  );
}

/* 2 — unha não pode ser reservada fora da quarta */
{
  const av = await slots(NAILS, THU);
  push("grade: unha/quinta fechada", av.closed === true, av.reason);
  const r = await post("/api/booking", {
    serviceId: NAILS,
    date: THU,
    time: "10:00",
    name: "Teste Guarda",
    whatsapp: "24999990002",
    email: "guarda@studio.com",
  });
  push(
    "POST: unha/quinta recusado",
    r.status >= 400,
    `status=${r.status} erro=${r.data?.error ?? "-"}`
  );
}

/* 3 — unha na quarta passa, paga e confirma */
{
  const av = await slots(NAILS, WED);
  push(
    "grade: unha/quinta aberta",
    av.closed === false && av.slots.length > 0,
    `slots=${av.slots?.length}`
  );
  if (av.closed || !av.slots?.length) {
    push("fluxo de unha completo", false, "sem horário na quarta");
  } else {
    const time = av.slots[0];
    const bk = await post("/api/booking", {
      serviceId: NAILS,
      date: WED,
      time,
      name: "Teste Unha",
      whatsapp: "24999990002",
      email: "unha@studio.com",
    });
    push(
      "POST: unha/quinta aceito",
      bk.status < 300 && Boolean(bk.data?.code),
      `status=${bk.status} code=${bk.data?.code ?? "-"} taxa=${
        bk.data?.fee ?? "-"
      }`
    );

    if (bk.data?.code) {
      const pay = await post("/api/booking/payment", {
        code: bk.data.code,
        method: "pix",
      });
      push(
        "pagamento de unha",
        pay.status < 300,
        `mode=${pay.data?.mode ?? "-"} valor=${pay.data?.amountCents ?? "-"}`
      );

      const ok = await post("/api/booking/approve", {
        code: bk.data.code,
      });
      push(
        "aprovação de unha",
        ok.data?.status === "confirmed" && ok.data?.paymentStatus === "paid",
        `status=${ok.data?.status} pagamento=${ok.data?.paymentStatus}`
      );
    }
  }
}

for (const [label, ok, detail] of results) {
  console.log(`${ok ? "OK  " : "FAIL"} | ${label} | ${detail}`);
}
const allOk = results.every(([, ok]) => ok);
console.log(
  `\n${allOk ? "GUARDAS OK — regra imposta pelo servidor." : "GUARDAS FALHARAM."}`
);
process.exitCode = allOk ? 0 : 1;
