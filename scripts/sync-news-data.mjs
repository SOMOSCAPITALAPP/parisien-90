import { readFile, writeFile } from "node:fs/promises";
import { newsFeed, newsMeta } from "../src/site-data.js";

const siteUrl = "https://parisien-90.vercel.app";
const publicDir = new URL("../public/", import.meta.url);
const currentDate = newsMeta.updatedAt.slice(0, 10);

const escapeXML = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const itemDate = (item) => {
  const date = item.date || currentDate;
  const [hour = "00", minute = "00"] = String(item.time).split(":");
  return new Date(`${date}T${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:00+02:00`);
};

const itemDateTimeISO = (item) => {
  const date = item.date || currentDate;
  const [hour = "00", minute = "00"] = String(item.time).split(":");
  return `${date}T${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:00+02:00`;
};

const freshnessSummary = newsFeed
  .slice(0, 5)
  .map((item) => item.title)
  .join(" ; ");

const newsPayload = {
  updatedAt: newsMeta.updatedAt,
  edition: newsMeta.edition,
  displayDate: newsMeta.displayDate,
  displayTime: newsMeta.displayTime,
  rightsNote: newsMeta.rightsNote,
  count: newsFeed.length,
  items: newsFeed.map((item) => ({
    id: item.id,
    category: item.category,
    date: item.date || currentDate,
    dateLabel: item.dateLabel || newsMeta.displayDate,
    time: item.time,
    dateTime: itemDateTimeISO(item),
    headline: item.title,
    summary: item.summary,
    tone: item.tone || item.category.toLowerCase(),
    reliability: item.reliability,
    viralScore: item.viral,
    source: item.source,
    sourceUrl: item.url
  }))
};

await writeFile(new URL("news.json", publicDir), `${JSON.stringify(newsPayload, null, 2)}\n`, "utf8");

const rssItems = newsFeed.slice(0, 12).map((item) => {
  const internalUrl = `${siteUrl}/actualite-psg/#news-${encodeURIComponent(item.id)}`;

  return `    <item>
      <title>${escapeXML(item.title)}</title>
      <link>${internalUrl}</link>
      <guid>${internalUrl}</guid>
      <pubDate>${itemDate(item).toUTCString().replace("GMT", "+0000")}</pubDate>
      <description>${escapeXML(`${item.summary} Source : ${item.source}.`)}</description>
    </item>`;
});

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Parisien 90 - Actu PSG</title>
    <link>${siteUrl}/</link>
    <description>Actualité PSG, mercato et transfert Paris Saint-Germain.</description>
    <language>fr-FR</language>
    <lastBuildDate>${new Date(newsMeta.updatedAt).toUTCString().replace("GMT", "+0000")}</lastBuildDate>
${rssItems.join("\n")}
  </channel>
</rss>
`;

await writeFile(new URL("rss.xml", publicDir), rss, "utf8");

const aiIndexPath = new URL("ai-index.json", publicDir);
const aiIndex = JSON.parse(await readFile(aiIndexPath, "utf8"));
aiIndex.site.lastVerifiedAt = newsMeta.updatedAt;
aiIndex.site.freshnessNote = `${newsMeta.edition}. Fil actif : ${newsFeed.length} entrées. À suivre : ${freshnessSummary}. Synthèses originales avec sources citées et liées.`;
await writeFile(aiIndexPath, `${JSON.stringify(aiIndex, null, 2)}\n`, "utf8");

const freshnessLine = `Dernière vérification éditoriale : ${newsMeta.displayDate}, ${newsMeta.displayTime} (Europe/Paris). ${newsMeta.edition}. Fil actif : ${newsFeed.length} entrées. À suivre : ${freshnessSummary}. Les sources sont citées et liées ; aucun article tiers n'est reproduit.`;

const llmsPath = new URL("llms.txt", publicDir);
const llms = await readFile(llmsPath, "utf8");
await writeFile(
  llmsPath,
  llms.replace(/^Dernière vérification éditoriale : .+$/m, freshnessLine),
  "utf8"
);

const llmsFullPath = new URL("llms-full.txt", publicDir);
const llmsFull = await readFile(llmsFullPath, "utf8");
await writeFile(
  llmsFullPath,
  llmsFull.replace(
    /## Signal de fraîcheur[\s\S]*?\n\nLe contenu est organisé/,
    `## Signal de fraîcheur — ${newsMeta.displayDate}, ${newsMeta.displayTime} (Europe/Paris)\n\n${newsMeta.edition}. Fil actif : ${newsFeed.length} entrées. À suivre : ${freshnessSummary}. Les informations sont réécrites, sourcées, catégorisées et partageables sans reproduire les articles tiers.\n\nLe contenu est organisé`
  ),
  "utf8"
);

const sitemapPath = new URL("sitemap.xml", publicDir);
const sitemap = await readFile(sitemapPath, "utf8");
await writeFile(
  sitemapPath,
  sitemap.replaceAll(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/g, `<lastmod>${currentDate}</lastmod>`),
  "utf8"
);

console.log(`News sync complete: ${newsFeed.length} items, ${newsMeta.edition}.`);
