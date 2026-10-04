/* Gera os ícones do PWA a partir do monograma BR (Logo.tsx).
 * Roda só durante o desenvolvimento — os PNGs gerados ficam commitados.
 *   node scripts/make-icons.cjs                                      */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const OUT_PUBLIC = path.join(__dirname, "..", "public");
const OUT_APP = path.join(__dirname, "..", "src", "app");

// Monograma igual ao do site: losango duplo + "BR".
function iconSvg(size, { bg }) {
  const s = size / 100; // viewBox original é 0 0 100 100
  return Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${bg}"/>
  <g transform="scale(${s})" fill="none" stroke-linejoin="round">
    <path d="M50 4 L96 50 L50 96 L4 50 Z" stroke="#c2a15d" stroke-width="1.9"/>
    <path d="M50 13 L87 50 L50 87 L13 50 Z" stroke="#dcc490" stroke-width="0.8" opacity="0.55"/>
    <text x="50" y="62" text-anchor="middle"
          font-family="Georgia, 'Times New Roman', serif"
          font-size="34" font-weight="500" letter-spacing="1.5"
          fill="#dcc490" stroke="none">BR</text>
  </g>
</svg>`);
}

const jobs = [
  { file: path.join(OUT_PUBLIC, "icon-192x192.png"), size: 192 },
  { file: path.join(OUT_PUBLIC, "icon-512x512.png"), size: 512 },
  { file: path.join(OUT_APP, "apple-icon.png"), size: 180 },
  { file: path.join(OUT_APP, "icon.png"), size: 96 },
];

(async () => {
  for (const job of jobs) {
    await sharp(iconSvg(job.size, { bg: "#0b0908" }))
      .png({ compressionLevel: 9 })
      .toFile(job.file);
    const st = fs.statSync(job.file);
    console.log(`ok  ${path.relative(path.join(__dirname, ".."), job.file)}  ${job.size}x${job.size}  ${st.size} B`);
  }
})().catch((e) => {
  console.error("FALHOU:", e.message);
  process.exit(1);
});
