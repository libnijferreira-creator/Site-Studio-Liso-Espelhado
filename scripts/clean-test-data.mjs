/**
 * Remove os agendamentos, clientes e avisos criados pelos scripts de
 * verificação, deixando a agenda limpa para uso real.
 * Uso: node scripts/clean-test-data.mjs [--force]
 *
 * Observações importantes:
 *  - os avisos (`notifications`) referenciam agendamentos por FK, então eles
 *    são apagados ANTES dos agendamentos;
 *  - cada script de teste usa um WhatsApp exclusivo (TEST_WHATS) porque o
 *    POST de reserva reaproveita cliente pelo número — com o mesmo número,
 *    todos os testes caíam no mesmo cliente e o nome era sobrescrito;
 *  - clientes são apagados apenas se não sobrar nenhum agendamento.
 */
import { DatabaseSync } from "node:sqlite";

const FORCE = process.argv.includes("--force");
const db = new DatabaseSync(
  "C:/Users/Empreendedores/Desktop/studio-liso/data/studio.db"
);

const TEST_NAMES = [
  "Verificacao Auto",
  "Teste Guarda",
  "Teste Unha",
  "Teste Fluxo UI",
  "Teste Aviso",
];

/** Números usados exclusivamente pelos scripts de teste. */
const TEST_WHATS = ["24999990001", "24999990002", "24999990003"];

const marks = TEST_NAMES.map(() => "?").join(", ");
const likes = TEST_NAMES.map(() => "message LIKE ?").join(" OR ");
const nameArgs = TEST_NAMES.map((n) => `%${n}%`);

function idsDeTeste() {
  const porNome = db
    .prepare(
      `SELECT id FROM appointments WHERE client_id IN (
         SELECT id FROM clients WHERE name IN (${marks}))`
    )
    .all(...TEST_NAMES)
    .map((r) => r.id);

  const porWhats = TEST_WHATS.length
    ? db
        .prepare(
          `SELECT id FROM appointments WHERE client_id IN (
             SELECT id FROM clients WHERE whatsapp IN (${TEST_WHATS.map(
               () => "?"
             ).join(", ")}))`
        )
        .all(...TEST_WHATS)
        .map((r) => r.id)
    : [];

  // Avisos já citam o nome do cliente de teste mesmo quando o cliente foi
  // renomeado depois (mesmo número reaproveitado).
  const porAviso = db
    .prepare(
      `SELECT DISTINCT appointment_id FROM notifications
        WHERE appointment_id IS NOT NULL AND (${likes})`
    )
    .all(...nameArgs)
    .map((r) => r.appointment_id);

  return [...new Set([...porNome, ...porWhats, ...porAviso])];
}

const alvoIds = idsDeTeste();
const alvo = alvoIds.length
  ? db
      .prepare(
        `SELECT id, code FROM appointments WHERE id IN (${alvoIds
          .map(() => "?")
          .join(", ")})`
      )
      .all(...alvoIds)
  : [];

const clientes = db
  .prepare(`SELECT id, name FROM clients WHERE name IN (${marks})`)
  .all(...TEST_NAMES);

const avisos = db.prepare(`SELECT COUNT(*) AS n FROM notifications WHERE ${likes}`).get(...nameArgs).n;

console.log(`Agendamentos de teste: ${alvo.length}`);
console.log(`Clientes de teste    : ${clientes.length}`);
console.log(`Avisos de teste      : ${avisos}`);

if (!FORCE && (alvo.length || clientes.length || avisos.length)) {
  console.log("\nPrévia (sem alterações). Rode com --force para apagar:");
  for (const a of alvo) console.log(`  - ${a.code}`);
  for (const c of clientes) console.log(`  - cliente: ${c.name}`);
}

if (FORCE) {
  db.exec("BEGIN");
  try {
    // 1) avisos primeiro (FK para appointments)
    for (const nome of TEST_NAMES) {
      db.prepare("DELETE FROM notifications WHERE message LIKE ?").run(
        `%${nome}%`
      );
    }
    if (alvoIds.length) {
      const ph = alvoIds.map(() => "?").join(", ");
      db.prepare(
        `DELETE FROM notifications WHERE appointment_id IN (${ph})`
      ).run(...alvoIds);
      // 2) agendamentos
      db.prepare(`DELETE FROM appointments WHERE id IN (${ph})`).run(
        ...alvoIds
      );
    }
    // 3) clientes de teste apenas se ficarem órfãos
    db.prepare(
      `DELETE FROM clients
        WHERE (name IN (${marks})
           OR whatsapp IN (${TEST_WHATS.map(() => "?").join(", ")}))
          AND NOT EXISTS (SELECT 1 FROM appointments a WHERE a.client_id = clients.id)`
    ).run(...TEST_NAMES, ...TEST_WHATS);

    db.exec("COMMIT");
    console.log("\nLIMPEZA CONCLUÍDA.");
  } catch (e) {
    db.exec("ROLLBACK");
    console.error("Falha, nada foi apagado:", e);
    process.exitCode = 1;
  }
}

console.log(
  "\nRestantes:",
  db.prepare("SELECT COUNT(*) AS n FROM appointments").get().n,
  "agendamentos /",
  db.prepare("SELECT COUNT(*) AS n FROM clients").get().n,
  "clientes /",
  db.prepare("SELECT COUNT(*) AS n FROM notifications").get().n,
  "avisos"
);

try {
  db.close();
} catch {
  /* ignora */
}
