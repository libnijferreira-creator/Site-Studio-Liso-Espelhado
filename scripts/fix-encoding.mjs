/**
 * Recupera arquivos UTF-8 corrompidos por leitura em ANSI (parcial ou total).
 *
 * O que aconteceu: `Get-Content` do PowerShell 5.1 lê UTF-8 sem BOM como
 * ANSI/CP1252. Ao regravar em UTF-8, cada byte UTF-8 vira dois caracteres
 * (a seta "↑" = E2 86 91 passa a "â†‘"; "horários" vira "horÃ¡rios").
 * É reversível: tratar cada caractere como byte CP1252 devolve os bytes
 * originais, que em UTF-8 são o texto certo.
 *
 * Este script varre o arquivo por TRECHOS corrompidos (cada caractere do
 * trecho vira exatamente um byte) e decodifica só o que for UTF-8 válido —
 * texto íntegro no mesmo arquivo não é tocado. Por isso funciona em arquivos
 * mistos (corrompidos por um comando e corrigidos por outro depois).
 *
 * Uso:  node scripts/fix-encoding.mjs            (simulação)
 *       node scripts/fix-encoding.mjs --apply    (grava)
 *       node scripts/fix-encoding.mjs caminho1 caminho2 --apply
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const aplicar = process.argv.includes("--apply");

// CP1252: pontos fora do Latin-1 que ocupam bytes 0x80–0x9F
const CP1252 = {
  0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85,
  0x2020: 0x86, 0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a,
  0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92,
  0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c,
  0x017e: 0x9e, 0x0178: 0x9f,
};

const MARCADOR = /Ã[\u0080-\u00bf\u00c0-\u024f]|â€|â†|\ufffd/;

/** caractere "suspeito": pode ser byte UTF-8 interpretado como CP1252 */
function byteDe(ch) {
  const cp = ch.codePointAt(0);
  if (cp <= 0xff) return cp;
  if (CP1252[cp] !== undefined) return CP1252[cp];
  return null;
}
function suspeito(ch) {
  const cp = ch.codePointAt(0);
  if (cp >= 0x80 && cp <= 0xff) {
    // Latin-1 alto: comum em mojibake (Ã, Â, ©, §…) — elegível
    return true;
  }
  return CP1252[cp] !== undefined; // † ' " – — … etc.
}

function tentaSequencia(bytes, pos) {
  const b0 = bytes[pos];
  let n, cp;
  if (b0 <= 0x7f) { n = 1; cp = b0; }
  else if ((b0 & 0xe0) === 0xc0) { n = 2; cp = b0 & 0x1f; }
  else if ((b0 & 0xf0) === 0xe0) { n = 3; cp = b0 & 0x0f; }
  else if ((b0 & 0xf8) === 0xf0) { n = 4; cp = b0 & 0x07; }
  else return null;
  for (let k = 1; k < n; k++) {
    const bk = bytes[pos + k];
    if (bk === undefined || (bk & 0xc0) !== 0x80) return null;
    cp = (cp << 6) | (bk & 0x3f);
  }
  if (n === 2 && cp < 0x80) return null;   // sobre-codificado
  if (n === 3 && cp < 0x800) return null;
  if (n === 4 && (cp < 0x10000 || cp > 0x10ffff)) return null;
  if (cp >= 0xd800 && cp <= 0xdfff) return null;
  return { n, ch: String.fromCodePoint(cp) };
}

function recuperar(texto) {
  const chars = [...texto];
  let saida = "";
  let i = 0;
  let corrompidos = 0;
  while (i < chars.length) {
    if (!suspeito(chars[i])) {
      saida += chars[i];
      i++;
      continue;
    }
    // monta o trecho de caracteres suspeitos (1 caractere = 1 byte)
    const inicio = i;
    const bytes = [];
    while (i < chars.length && suspeito(chars[i])) {
      bytes.push(byteDe(chars[i]));
      i++;
    }
    // decodifica o máximo possível de UTF-8 válido a partir do início
    let p = 0;
    let consumidos = 0;
    while (p < bytes.length) {
      const s = tentaSequencia(bytes, p);
      if (!s) break;
      const resto = bytes.slice(p, p + s.n);
      if (resto.some((b) => b === undefined)) break;
      p += s.n;
      consumidos = p;
      saida += s.ch;
    }
    corrompidos += consumidos;
    // o que não decodificou volta como estava
    for (let k = consumidos; k < bytes.length; k++) saida += chars[inicio + k];
  }
  return { texto: saida, bytesCorrigidos: corrompidos };
}

function varrer(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === ".next") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) varrer(p, acc);
    else if (/\.(tsx?|css|mjs|cjs|md)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

const alvos = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const arquivos = alvos.length
  ? alvos.map((a) => path.resolve(root, a))
  : [
      ...varrer(path.join(root, "src")),
      ...varrer(path.join(root, "scripts")),
      ...varrer(path.join(root, "docs")),
    ];

let total = 0;
for (const arquivo of arquivos) {
  if (!fs.existsSync(arquivo)) continue;
  const texto = fs.readFileSync(arquivo, "utf8");
  if (!MARCADOR.test(texto)) continue;
  const { texto: recuperado, bytesCorrigidos } = recuperar(texto);
  if (!recuperado.includes("�") && MARCADOR.test(recuperado)) {
    console.log(`PULADO (ainda com mojibake): ${path.relative(root, arquivo)}`);
    continue;
  }
  if (recuperado === texto) continue;
  total++;
  const amostra = recuperado.match(/[^\n"]{0,20}[\u00c0-\u024f][^\n"]{0,12}/);
  console.log(
    `${path.relative(root, arquivo)}: ${bytesCorrigidos} byte(s) -> "${
      amostra ? amostra[0] : "?"
    }"`
  );
  if (aplicar) fs.writeFileSync(arquivo, recuperado, "utf8");
}

console.log(
  `\n${total} arquivo(s) ${aplicar ? "RECUPERADO(S)" : "recuperável(is) (use --apply)"}`
);
