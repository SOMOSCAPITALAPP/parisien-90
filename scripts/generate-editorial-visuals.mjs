import { mkdir, writeFile } from "node:fs/promises";

const paletteByCategory = {
  "Ligue des champions": ["#071426", "#123a78", "#e7c15a"],
  "Tactique PSG": ["#071426", "#115e59", "#65d6c7"],
  "Joueurs PSG": ["#071426", "#5a2358", "#f3a8d9"],
  "Mercato PSG": ["#071426", "#6b2c19", "#f1ae6a"],
  "Ligue 1": ["#071426", "#243b69", "#89b5ff"],
  "Histoire PSG": ["#071426", "#5d4a16", "#f1d98a"]
};

const slugify = (value) => String(value)
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

const escapeXml = (value) => String(value || "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&apos;");

const headlineLines = (value, maxLength = 31) => {
  const words = String(value || "Parisien 90").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxLength && line) {
      lines.push(line);
      line = word;
      if (lines.length === 2) break;
    } else line = next;
  }
  if (line && lines.length < 2) lines.push(line);
  return lines;
};

const topicGraphic = (item, accent) => {
  const text = `${item.category || ""} ${item.title || ""}`.toLowerCase();
  if (/mercato|transfert|arriv|depart|contrat/.test(text)) return `<path d="M1050 522H1420" stroke="${accent}" stroke-width="18" stroke-linecap="round"/><path d="m1352 450 72 72-72 72M1420 650h-370" stroke="white" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" opacity="0.86"/><path d="m1118 578-72 72 72 72" stroke="white" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" opacity="0.86"/>`;
  if (/tactique|composition|systeme|pressing|jeu/.test(text)) return `<g fill="${accent}"><circle cx="1080" cy="445" r="22"/><circle cx="1235" cy="350" r="22"/><circle cx="1235" cy="550" r="22"/><circle cx="1400" cy="445" r="22"/></g><g stroke="white" stroke-width="8" opacity="0.82"><path d="M1104 440 1208 360M1104 450l104 92M1260 360l112 76M1260 544l112-84"/></g>`;
  if (/ligue des champions|champions league|uefa/.test(text)) return `<g fill="${accent}" opacity="0.9"><path d="m1240 302 17 52h55l-45 32 17 53-44-32-45 32 17-53-45-32h56z"/><path d="m1090 470 13 39h42l-34 24 13 40-34-25-34 25 13-40-34-24h42z"/><path d="m1390 500 13 39h42l-34 24 13 40-34-25-34 25 13-40-34-24h42z"/></g>`;
  if (/match|victoire|defaite|nul|psg .*[-–]|[-–].*psg/.test(text)) return `<rect x="1050" y="385" width="390" height="192" rx="12" fill="none" stroke="${accent}" stroke-width="10"/><path d="M1245 385v192" stroke="white" stroke-width="4" opacity="0.65"/><text x="1100" y="500" fill="white" font-family="Arial, Helvetica, sans-serif" font-size="66" font-weight="700">PSG</text><text x="1283" y="500" fill="${accent}" font-family="Arial, Helvetica, sans-serif" font-size="66" font-weight="700">90</text>`;
  if (/histoire|ancien|ronaldinho|neymar|messi|rai|valdo/.test(text)) return `<path d="M1050 545H1445" stroke="${accent}" stroke-width="10"/><circle cx="1110" cy="545" r="25" fill="${accent}"/><circle cx="1245" cy="545" r="25" fill="${accent}"/><circle cx="1380" cy="545" r="25" fill="${accent}"/><path d="M1110 468v-82M1245 468v-130M1380 468v-80" stroke="white" stroke-width="7" opacity="0.75"/>`;
  return `<path d="M1140 590v-172c0-42 35-76 78-76h74c43 0 78 34 78 76v172" fill="none" stroke="${accent}" stroke-width="14"/><text x="1190" y="520" fill="white" font-family="Arial, Helvetica, sans-serif" font-size="78" font-weight="700">90</text>`;
};

const visualFor = (item) => {
  const category = item.category || "Parisien 90";
  const [ink, field, accent] = paletteByCategory[category] || ["#071426", "#1d3557", "#e63b54"];
  const id = slugify(item.id || item.title);
  const seed = [...id].reduce((total, char) => total + char.charCodeAt(0), 0);
  const circleX = 840 + (seed % 180);
  const circleY = 250 + (seed % 120);
  const lines = headlineLines(item.title);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" role="img" aria-labelledby="title desc">
  <title id="title">Illustration éditoriale Parisien 90 : ${escapeXml(item.title)}</title>
  <desc id="desc">Illustration de football originale, sans portrait, logo ni marque de club.</desc>
  <rect width="1600" height="900" fill="${ink}"/><rect width="1600" height="900" fill="${field}" opacity="0.56"/>
  <path d="M-70 710C235 478 479 906 799 631S1293 282 1660 440" fill="none" stroke="${accent}" stroke-width="10" opacity="0.72"/><path d="M-40 786C318 482 595 940 947 665S1306 425 1630 514" fill="none" stroke="white" stroke-width="2" opacity="0.34"/>
  <circle cx="${circleX}" cy="${circleY}" r="188" fill="none" stroke="${accent}" stroke-width="18" opacity="0.78"/><circle cx="${circleX}" cy="${circleY}" r="93" fill="none" stroke="white" stroke-width="4" opacity="0.58"/><path d="M1120 0L1600 0 1600 350Z" fill="${accent}" opacity="0.18"/>
  <text x="118" y="214" fill="${accent}" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700" letter-spacing="5">${escapeXml(category.toUpperCase())}</text>
  <text x="118" y="308" fill="white" font-family="Arial, Helvetica, sans-serif" font-size="68" font-weight="700">${escapeXml(lines[0] || "PARISIEN 90")}</text>${lines[1] ? `<text x="118" y="382" fill="white" font-family="Arial, Helvetica, sans-serif" font-size="68" font-weight="700">${escapeXml(lines[1])}</text>` : ""}
  <text x="118" y="448" fill="white" font-family="Arial, Helvetica, sans-serif" font-size="27" opacity="0.78">Parisien 90 · ${escapeXml(item.dateLabel || item.date || "")}</text>
  ${topicGraphic(item, accent)}
  <text x="118" y="812" fill="white" font-family="Arial, Helvetica, sans-serif" font-size="24" opacity="0.68">Illustration éditoriale originale · Sans portrait ni signe de club</text>
</svg>`;
};

export const articleVisualPath = (item) => `/images/articles/${slugify(item.id || item.title)}.svg`;
export const generateEditorialVisuals = async ({ outputDir, articles }) => {
  await mkdir(outputDir, { recursive: true });
  await Promise.all(articles.map((item) => writeFile(new URL(`${slugify(item.id || item.title)}.svg`, outputDir), visualFor(item), "utf8")));
};
