/**
 * Associa <label> aos campos do painel (htmlFor + id).
 *
 * Motivo: os formulários usavam <label> apenas visual (sem htmlFor), então os
 * campos ficavam sem rótulo para leitores de tela e o Lighthouse reprovava a
 * regra "label". Este script varre todos os .tsx de src, casa cada <label> com
 * o próximo controle (input/textarea/select não oculto) e grava htmlFor/id.
 *
 * Uso:  node scripts/fix-labels.mjs          (apenas mostra o que mudaria)
 *       node scripts/fix-labels.mjs --apply  (grava os arquivos)
 *
 * Não mexe em <label> que já envolve o controle (associação implícita) nem em
 * quem já tem htmlFor.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const aplicar = process.argv.includes("--apply");

function arquivosTsx(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) arquivosTsx(p, acc);
    else if (e.name.endsWith(".tsx")) acc.push(p);
  }
  return acc;
}

const idValido = (s) => /^[A-Za-z][\w-]*$/.test(s);

let totalArquivos = 0;
let totalLabels = 0;

for (const arquivo of arquivosTsx(path.join(root, "src"))) {
  const texto = fs.readFileSync(arquivo, "utf8");
  const usados = new Set(
    [...texto.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1])
  );
  let novo = texto;
  let mudancas = 0;

  // varre de trás para frente para as inserções não invalidarem os offsets
  const matches = [...texto.matchAll(/<label\b([^>]*)>([\s\S]*?)<\/label>/g)];
  for (const m of [...matches].reverse()) {
    const attrs = m[1];
    const corpo = m[2];
    if (/htmlFor=/.test(attrs)) continue; // já associado
    if (/<(input|textarea|select)\b/.test(corpo)) continue; // associação implícita

    const inicio = m.index + m[0].length;
    const janela = texto.slice(inicio, inicio + 600);
    const alvo = janela.match(
      /<(input|textarea|select)\b([^>]*)>/
    );
    if (!alvo) continue;
    if (/type="hidden"/.test(alvo[2])) continue;
    // para no se houver outro <label> antes (campo de outra área)
    const outroLabel = janela.slice(0, alvo.index).indexOf("<label");
    if (outroLabel !== -1) continue;

    // id do controle: usa o existente, senão deriva do name
    const idExistente = alvo[2].match(/\bid="([^"]+)"/);
    let id;
    if (idExistente) {
      id = idExistente[1];
    } else {
      const nome = alvo[2].match(/\bname="([^"]+)"/);
      const base = (nome ? nome[1] : `campo-${mudancas + 1}`)
        .replace(/[^\w-]+/g, "-")
        .replace(/^-+|-+$/g, "");
      id = idValido(base) ? base : `campo-${base}`;
      let unico = id;
      let n = 2;
      while (usados.has(unico)) unico = `${id}-${n++}`;
      id = unico;
      usados.add(id);
      // insere id no controle
      const novoTag = `<${alvo[1]} id="${id}"${alvo[2]}>`;
      novo =
        novo.slice(0, inicio + alvo.index) +
        novoTag +
        novo.slice(inicio + alvo.index + alvo[0].length);
    }

    // insere htmlFor na label
    const attrsNovos = attrs.replace(/\s*$/, "") + ` htmlFor="${id}"`;
    novo =
      novo.slice(0, m.index) +
      `<label${attrsNovos}>${corpo}</label>` +
      novo.slice(m.index + m[0].length);
    mudancas++;
  }

  if (mudancas > 0) {
    totalArquivos++;
    totalLabels += mudancas;
    console.log(`${path.relative(root, arquivo)}: ${mudancas} label(s)`);
    if (aplicar) fs.writeFileSync(arquivo, novo, "utf8");
  }
}

console.log(
  `\n${totalLabels} labels em ${totalArquivos} arquivo(s) — ${
    aplicar ? "APLICADO" : "simulação (use --apply para gravar)"
  }`
);
