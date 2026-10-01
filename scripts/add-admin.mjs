/**
 * Cria um login novo no painel pelo terminal (alternativa à tela Usuários).
 *
 * Uso:  node scripts/add-admin.mjs <usuario> <senha>
 * Ex.:  node scripts/add-admin.mjs joana senha12345
 *
 * O servidor pode estar ligado — o SQLite (WAL) aceita as duas conexões.
 */
import { randomBytes, scryptSync } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const [usuario, senha] = process.argv.slice(2);

function sair(mensagem) {
  console.error(`✗ ${mensagem}`);
  process.exit(1);
}

if (!usuario || !senha) {
  console.error("Uso: node scripts/add-admin.mjs <usuario> <senha>");
  console.error("Ex.: node scripts/add-admin.mjs joana senha12345");
  process.exit(1);
}

const u = usuario.trim().toLowerCase();
if (u.length < 3 || !/^[a-zA-Z0-9._-]+$/.test(u)) {
  sair("Usuário precisa de 3+ caracteres (letras, números, ponto, hífen ou _).");
}
if (senha.length < 8) sair("A senha precisa ter pelo menos 8 caracteres.");

const dbPath = path.join(process.cwd(), "data", "studio.db");
if (!fs.existsSync(dbPath)) {
  sair(`Banco não encontrado em ${dbPath} — rode "npm start" uma vez antes.`);
}

const db = new DatabaseSync(dbPath);

const existe = db
  .prepare("SELECT COUNT(*) AS n FROM admins WHERE username = ?")
  .get(u);
if (existe.n > 0) {
  db.close();
  sair(`O usuário "${u}" já existe. Escolha outro nome.`);
}

const salt = randomBytes(16).toString("hex");
const hash = scryptSync(senha, salt, 64).toString("hex");
db
  .prepare("INSERT INTO admins (username, password_hash, salt) VALUES (?, ?, ?)")
  .run(u, hash, salt);

const total = db.prepare("SELECT COUNT(*) AS n FROM admins").get();
db.close();

console.log(`✓ Login criado: ${u}`);
console.log(`  Entre em http://localhost:3000/admin/login com a senha que você passou.`);
console.log(`  Agora há ${total.n} usuário(s) no painel.`);
