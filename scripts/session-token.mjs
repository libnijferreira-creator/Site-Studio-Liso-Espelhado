/**
 * Cria uma sessão de administrador direto no banco e imprime o token.
 * Uso:  node scripts/session-token.mjs
 * Serve para testes automatizados (curl) sem passar pelo formulário de login.
 */
import { DatabaseSync } from "node:sqlite";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const db = new DatabaseSync(path.join(root, "data", "studio.db"));

const admin = db
  .prepare("SELECT id FROM admins ORDER BY id LIMIT 1")
  .get();

if (!admin) {
  console.error("Nenhum administrador encontrado no banco.");
  process.exit(1);
}

const token = randomBytes(32).toString("hex");
const expires = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();

db.prepare("DELETE FROM sessions WHERE admin_id = ?").run(admin.id);
db.prepare(
  "INSERT INTO sessions (token, admin_id, expires_at) VALUES (?, ?, ?)"
).run(token, admin.id, expires);

process.stdout.write(token);
