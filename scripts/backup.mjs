/**
 * Backup do banco de agendamentos.
 *
 * Uso: node scripts/backup.mjs
 * Gera data/backups/studio-AAAA-MM-DD-HHMM.db (cópia consistente, via
 * VACUUM INTO — pode rodar com o servidor ligado) e mantém os 14 últimos.
 */
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const dbPath = path.join(process.cwd(), "data", "studio.db");
if (!fs.existsSync(dbPath)) {
  console.error(`✗ Banco não encontrado: ${dbPath}`);
  process.exit(1);
}

const dir = path.join(process.cwd(), "data", "backups");
fs.mkdirSync(dir, { recursive: true });

const agora = new Date();
const carimbo = [
  agora.getFullYear(),
  String(agora.getMonth() + 1).padStart(2, "0"),
  String(agora.getDate()).padStart(2, "0"),
].join("-") +
  "-" +
  [String(agora.getHours()).padStart(2, "0"), String(agora.getMinutes()).padStart(2, "0")].join("");

const destino = path.join(dir, `studio-${carimbo}.db`);

const db = new DatabaseSync(dbPath);
db.exec(`VACUUM INTO '${destino.replace(/'/g, "''")}'`);
db.close();

const backups = fs
  .readdirSync(dir)
  .filter((f) => f.startsWith("studio-") && f.endsWith(".db"))
  .sort();

// mantém só os 14 mais recentes
while (backups.length > 14) {
  const velho = backups.shift();
  fs.unlinkSync(path.join(dir, velho));
}

const kb = Math.round(fs.statSync(destino).size / 1024);
console.log(`✓ Backup criado: ${destino} (${kb} KB)`);
console.log(`  Backups guardados: ${Math.min(backups.length, 14)}`);
