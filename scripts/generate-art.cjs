/**
 * Gera as artes editoriais usadas como fundo do site enquanto as fotos
 * reais do Studio não são enviadas. Estética: seda, luz dourada e grão fino.
 */
const fs = require("node:fs");
const path = require("node:path");

const OUT = path.join(__dirname, "..", "public", "art");
fs.mkdirSync(OUT, { recursive: true });

function silk({ w, h, id, stops, lines, glow }) {
  const curves = [];
  for (let i = 0; i < lines.count; i++) {
    const t = i / Math.max(1, lines.count - 1);
    const y0 = h * (0.08 + t * 0.84);
    const amp = h * lines.amp * (0.55 + 0.75 * Math.sin(t * Math.PI));
    const c1 = h * (0.2 + 0.6 * t);
    const c2 = h * (0.5 + 0.55 * t);
    const y1 = y0 + amp * (i % 2 === 0 ? 1 : -1);
    const opacity = (0.1 + 0.55 * Math.sin(t * Math.PI)).toFixed(3);
    const sw = (lines.sw * (0.5 + 1.3 * Math.sin(t * Math.PI))).toFixed(2);
    curves.push(
      `<path d="M ${-w * 0.1} ${y0.toFixed(1)} C ${w * 0.3} ${c1.toFixed(1)}, ${w * 0.62} ${c2.toFixed(1)}, ${w * 1.1} ${y1.toFixed(1)}" fill="none" stroke="${lines.color}" stroke-width="${sw}" opacity="${opacity}" stroke-linecap="round"/>`
    );
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="bg${id}" x1="0" y1="0" x2="1" y2="1">
      ${stops.map((s, i) => `<stop offset="${(i / (stops.length - 1)) * 100}%" stop-color="${s}"/>`).join("")}
    </linearGradient>
    <radialGradient id="glow${id}" cx="${glow.x}%" cy="${glow.y}%" r="${glow.r}%">
      <stop offset="0%" stop-color="${glow.color}" stop-opacity="${glow.o}"/>
      <stop offset="100%" stop-color="${glow.color}" stop-opacity="0"/>
    </radialGradient>
    <filter id="grain${id}">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.055"/></feComponentTransfer>
      <feComposite operator="over" in2="SourceGraphic"/>
    </filter>
    <filter id="soft${id}"><feGaussianBlur stdDeviation="${lines.blur}"/></filter>
  </defs>

  <rect width="${w}" height="${h}" fill="url(#bg${id})"/>
  <rect width="${w}" height="${h}" fill="url(#glow${id})"/>

  <g filter="url(#soft${id})">${curves.join("")}</g>
  <g>${curves.filter((_, i) => i % 3 === 0).join("")}</g>

  <rect width="${w}" height="${h}" filter="url(#grain${id})" opacity="0.5" style="mix-blend-mode:overlay"/>
</svg>`;
}

const files = {
  "hero.svg": silk({
    w: 1600, h: 1000, id: "H",
    stops: ["#150f0c", "#3d2b21", "#7b5c43", "#2a1e19"],
    lines: { count: 26, amp: 0.14, sw: 7, color: "#e9d3a5", blur: 9 },
    glow: { x: 72, y: 26, r: 78, color: "#d9b26a", o: 0.5 },
  }),
  "portrait.svg": silk({
    w: 1000, h: 1250, id: "P",
    stops: ["#2a1e19", "#6b4e3a", "#c9a06a", "#2a1e19"],
    lines: { count: 20, amp: 0.1, sw: 6, color: "#f3e2c4", blur: 10 },
    glow: { x: 34, y: 24, r: 70, color: "#f0d9a8", o: 0.45 },
  }),
  "service.svg": silk({
    w: 900, h: 700, id: "S",
    stops: ["#f7f3ee", "#e7dcc9", "#dcc6b4", "#f3ece1"],
    lines: { count: 22, amp: 0.13, sw: 5, color: "#b9974f", blur: 7 },
    glow: { x: 68, y: 30, r: 68, color: "#fffaf0", o: 0.75 },
  }),
  "gallery.svg": silk({
    w: 900, h: 1100, id: "G",
    stops: ["#efe8de", "#f7f3ee", "#e7dcc9", "#dcc6b4"],
    lines: { count: 24, amp: 0.15, sw: 5, color: "#c2a15d", blur: 8 },
    glow: { x: 30, y: 70, r: 72, color: "#ffffff", o: 0.7 },
  }),
  "studio.svg": silk({
    w: 1200, h: 800, id: "T",
    stops: ["#0b0908", "#2a1e19", "#5b4234", "#1b1310"],
    lines: { count: 22, amp: 0.12, sw: 6, color: "#dcc490", blur: 9 },
    glow: { x: 50, y: 35, r: 75, color: "#c2a15d", o: 0.42 },
  }),
  "promo.svg": silk({
    w: 1200, h: 700, id: "M",
    stops: ["#2a1e19", "#7b5c30", "#c9a06a", "#3a2a22"],
    lines: { count: 18, amp: 0.16, sw: 7, color: "#fbf1da", blur: 10 },
    glow: { x: 76, y: 22, r: 70, color: "#f4d99a", o: 0.5 },
  }),
  "video.svg": silk({
    w: 900, h: 1200, id: "V",
    stops: ["#150f0c", "#4a382f", "#9a7c3f", "#1b1310"],
    lines: { count: 20, amp: 0.12, sw: 6, color: "#f0dfb6", blur: 8 },
    glow: { x: 50, y: 45, r: 65, color: "#e8c57a", o: 0.55 },
  }),
};

for (const [name, svg] of Object.entries(files)) {
  fs.writeFileSync(path.join(OUT, name), svg, "utf8");
  console.log("gerado:", name, `${(svg.length / 1024).toFixed(1)} KB`);
}
