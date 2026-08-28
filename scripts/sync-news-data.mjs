import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { newsFeed, newsMeta } from "../src/site-data.js";

const siteUrl = "https://parisien-90.vercel.app";
const publicDir = new URL("../public/", import.meta.url);
const newsDir = new URL("../news/", import.meta.url);
const currentDate = newsMeta.updatedAt.slice(0, 10);
const heroImage = `${siteUrl}/hero-stadium.png`;

const staticPages = [
  { path: "/", changefreq: "hourly", priority: "1.0" },
  { path: "/transfert-psg/", changefreq: "hourly", priority: "1.0" },
  { path: "/mercato-psg/", changefreq: "hourly", priority: "0.95" },
  { path: "/actualite-psg/", changefreq: "hourly", priority: "0.9" },
  { path: "/calendrier-psg/", changefreq: "daily", priority: "0.75" },
  { path: "/joueurs-psg/", changefreq: "daily", priority: "0.75" },
  { path: "/sources-psg/", changefreq: "weekly", priority: "0.7" },
  { path: "/histoire-psg/", changefreq: "weekly", priority: "0.85" },
  { path: "/droits-disclaimer/", changefreq: "monthly", priority: "0.7" },
  { path: "/llms.txt", changefreq: "weekly", priority: "0.5" },
  { path: "/llms-full.txt", changefreq: "weekly", priority: "0.5" }
];

const escapeHTML = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const escapeXML = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const safeJson = (value) => JSON.stringify(value, null, 2).replaceAll("</", "<\\/");

const slugify = (value) => {
  const slug = String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "article-psg";
};

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

const itemPath = (item) => `/news/${slugify(item.id)}/`;
const itemUrl = (item) => `${siteUrl}${itemPath(item)}`;
const sourceUrl = (item) => new URL(item.url, siteUrl).href;

const getTopicPath = (item) => {
  const category = String(item.category || "").toLowerCase();
  const title = String(item.title || "").toLowerCase();
  if (category.includes("mercato") || title.includes("transfert")) return "/transfert-psg/";
  if (category.includes("calendrier") || category.includes("match") || category.includes("europe")) return "/calendrier-psg/";
  if (category.includes("effectif") || category.includes("staff") || category.includes("joueur")) return "/joueurs-psg/";
  if (category.includes("histoire") || category.includes("ancien")) return "/histoire-psg/";
  return "/actualite-psg/";
};

const freshnessSummary = newsFeed
  .slice(0, 5)
  .map((item) => item.title)
  .join(" ; ");

const makeArticlePage = (item) => {
  const url = itemUrl(item);
  const dateTime = itemDateTimeISO(item);
  const related = newsFeed
    .filter((candidate) => candidate.id !== item.id && candidate.category === item.category)
    .slice(0, 4);
  const title = `${item.title} | Parisien 90`;
  const description = `${item.summary} Source : ${item.source}.`;
  const topicPath = getTopicPath(item);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: item.title,
    description: item.summary,
    image: [heroImage],
    datePublished: dateTime,
    dateModified: newsMeta.updatedAt,
    inLanguage: "fr-FR",
    articleSection: item.category,
    keywords: ["PSG", "Paris Saint-Germain", "actualité PSG", "transfert PSG", "mercato PSG", item.category],
    author: { "@type": "Organization", name: "Parisien 90" },
    publisher: {
      "@type": "Organization",
      name: "Parisien 90",
      logo: { "@type": "ImageObject", url: heroImage }
    },
    isBasedOn: { "@type": "CreativeWork", name: item.source, url: sourceUrl(item) },
    about: { "@type": "SportsTeam", name: "Paris Saint-Germain" }
  };

  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHTML(title)}</title>
    <meta name="description" content="${escapeHTML(description)}" />
    <link rel="canonical" href="${escapeHTML(url)}" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="apple-touch-icon" href="/icons/parisien-90-app-icon.svg" />
    <meta name="theme-color" content="#071426" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${escapeHTML(item.title)}" />
    <meta property="og:description" content="${escapeHTML(item.summary)}" />
    <meta property="og:url" content="${escapeHTML(url)}" />
    <meta property="og:image" content="${escapeHTML(heroImage)}" />
    <meta property="article:published_time" content="${escapeHTML(dateTime)}" />
    <meta property="article:modified_time" content="${escapeHTML(newsMeta.updatedAt)}" />
    <meta property="article:section" content="${escapeHTML(item.category)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHTML(item.title)}" />
    <meta name="twitter:description" content="${escapeHTML(item.summary)}" />
    <meta name="twitter:image" content="${escapeHTML(heroImage)}" />
    <script type="application/ld+json">${safeJson(jsonLd)}</script>
    <link rel="stylesheet" href="/src/styles.css" />
  </head>
  <body>
    <header class="site-header">
      <a class="brand" href="/" aria-label="Parisien 90">
        <span class="brand-mark">P90</span>
        <span><strong>Parisien 90</strong><small>PSG live desk</small></span>
      </a>
      <nav class="main-nav" aria-label="Navigation principale">
        <a href="/transfert-psg/">Transfert PSG</a>
        <a href="/mercato-psg/">Mercato PSG</a>
        <a href="/actualite-psg/">Actualité PSG</a>
        <a href="/calendrier-psg/">Calendrier</a>
        <a href="/joueurs-psg/">Joueurs</a>
        <a href="/histoire-psg/">Histoire</a>
        <a href="/sources-psg/">Sources</a>
      </nav>
    </header>
    <main>
      <nav class="breadcrumb" aria-label="Fil d'Ariane">
        <a href="/">Accueil</a><span>/</span><a href="/actualite-psg/">Actualité PSG</a><span>/</span><span>${escapeHTML(item.category)}</span>
      </nav>
      <article class="article-page" data-share-title="${escapeHTML(item.title)}" data-share-url="${escapeHTML(itemPath(item))}">
        <div class="article-hero">
          <div class="item-tags">
            <span>${escapeHTML(item.category)}</span>
            <span>${escapeHTML(item.reliability)}</span>
            <span>Viral ${escapeHTML(item.viral)}</span>
          </div>
          <time datetime="${escapeHTML(dateTime)}">${escapeHTML(item.dateLabel || newsMeta.displayDate)} · ${escapeHTML(item.time)}</time>
          <h1>${escapeHTML(item.title)}</h1>
          <p>${escapeHTML(item.summary)}</p>
        </div>
        <div class="article-layout">
          <div class="article-body">
            <p>${escapeHTML(item.summary)}</p>
            <p>Parisien 90 retient cette information parce qu'elle touche directement le récit du Paris Saint-Germain : son mercato, son calendrier, son effectif ou sa dynamique sportive. Le signal est classé <strong>${escapeHTML(item.reliability)}</strong> et relié à la source disponible.</p>
            <p>Cette page ne reproduit pas l'article d'origine. Elle propose une synthèse originale, courte, datée et sourcée pour faciliter la veille des supporters, des moteurs de recherche et des modèles d'IA.</p>
            <div class="source-box">
              <span>Source citée</span>
              <a href="${escapeHTML(sourceUrl(item))}" rel="noopener noreferrer">${escapeHTML(item.source)}</a>
            </div>
          </div>
          <aside class="article-sidebar">
            <span class="section-kicker">À relier</span>
            <a href="${escapeHTML(topicPath)}">Page pilier liée</a>
            <a href="/transfert-psg/">Transfert PSG</a>
            <a href="/mercato-psg/">Mercato PSG</a>
            <a href="/joueurs-psg/">Joueurs PSG</a>
            <a href="/calendrier-psg/">Calendrier PSG</a>
            <a href="/sources-psg/">Méthode et sources</a>
          </aside>
        </div>
      </article>
      <section class="content-section">
        <div class="section-heading">
          <div>
            <span class="section-kicker">Même dossier</span>
            <h2>Articles liés</h2>
          </div>
        </div>
        <div class="hot-grid">
          ${related
            .map(
              (candidate) => `<article class="news-card" data-share-title="${escapeHTML(candidate.title)}" data-share-url="${escapeHTML(itemPath(candidate))}">
            <time class="news-date" datetime="${escapeHTML(itemDateTimeISO(candidate))}">${escapeHTML(candidate.dateLabel || newsMeta.displayDate)} · ${escapeHTML(candidate.time)}</time>
            <div class="news-topline"><span>${escapeHTML(candidate.category)}</span><strong>Viral ${escapeHTML(candidate.viral)}</strong></div>
            <h3><a href="${escapeHTML(itemPath(candidate))}">${escapeHTML(candidate.title)}</a></h3>
            <p>${escapeHTML(candidate.summary)}</p>
            <a href="${escapeHTML(itemPath(candidate))}">Lire l'article</a>
          </article>`
            )
            .join("")}
        </div>
      </section>
    </main>
    <footer class="site-footer">
      <p>Parisien 90 - média indépendant consacré au Paris Saint-Germain.</p>
      <a href="/sitemap.xml">Sitemap</a>
      <a href="/rss.xml">RSS</a>
      <a href="/droits-disclaimer/">Droits & disclaimer</a>
    </footer>
    <script type="module" src="/src/site.js"></script>
  </body>
</html>
`;
};

const newsPayload = {
  updatedAt: newsMeta.updatedAt,
  edition: newsMeta.edition,
  displayDate: newsMeta.displayDate,
  displayTime: newsMeta.displayTime,
  rightsNote: newsMeta.rightsNote,
  count: newsFeed.length,
  items: newsFeed.map((item) => ({
    count: newsFeed.length,
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
    internalUrl: itemUrl(item),
    source: item.source,
    sourceUrl: sourceUrl(item)
  }))
};

await writeFile(new URL("news.json", publicDir), `${JSON.stringify(newsPayload, null, 2)}\n`, "utf8");

await rm(newsDir, { recursive: true, force: true });
await mkdir(newsDir, { recursive: true });

await Promise.all(
  newsFeed.map(async (item) => {
    const articleDir = new URL(`${slugify(item.id)}/`, newsDir);
    await mkdir(articleDir, { recursive: true });
    await writeFile(new URL("index.html", articleDir), makeArticlePage(item), "utf8");
  })
);

const rssItems = newsFeed.slice(0, 24).map((item) => {
  const internalUrl = itemUrl(item);

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
aiIndex.site.freshnessNote = `${newsMeta.edition}. Fil actif : ${newsFeed.length} entrées, avec pages individuelles crawlables sous /news/. À suivre : ${freshnessSummary}. Synthèses originales avec sources citées et liées.`;
aiIndex.news = newsFeed.slice(0, 30).map((item) => ({
  title: item.title,
  category: item.category,
  dateTime: itemDateTimeISO(item),
  url: itemUrl(item),
  source: item.source,
  sourceUrl: sourceUrl(item),
  reliability: item.reliability
}));
await writeFile(aiIndexPath, `${JSON.stringify(aiIndex, null, 2)}\n`, "utf8");

const freshnessLine = `Dernière vérification éditoriale : ${newsMeta.displayDate}, ${newsMeta.displayTime} (Europe/Paris). ${newsMeta.edition}. Fil actif : ${newsFeed.length} entrées. Chaque news importante dispose d'une page individuelle sous /news/ avec date, heure, source citée, balisage NewsArticle et liens internes. À suivre : ${freshnessSummary}. Les sources sont citées et liées ; aucun article tiers n'est reproduit.`;

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
    `## Signal de fraîcheur — ${newsMeta.displayDate}, ${newsMeta.displayTime} (Europe/Paris)\n\n${newsMeta.edition}. Fil actif : ${newsFeed.length} entrées, enrichies en pages individuelles crawlables sous /news/. À suivre : ${freshnessSummary}. Les informations sont réécrites, sourcées, catégorisées, partageables et balisées en NewsArticle sans reproduire les articles tiers.\n\nLe contenu est organisé`
  ),
  "utf8"
);

const sitemapUrls = [
  ...staticPages.map((page) => ({
    loc: `${siteUrl}${page.path}`,
    lastmod: currentDate,
    changefreq: page.changefreq,
    priority: page.priority
  })),
  ...newsFeed.map((item) => ({
    loc: itemUrl(item),
    lastmod: item.date || currentDate,
    changefreq: "weekly",
    priority: Number(item.viral) >= 90 ? "0.85" : "0.75"
  }))
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls
  .map(
    (url) => `  <url>
    <loc>${escapeXML(url.loc)}</loc>
    <lastmod>${escapeXML(url.lastmod)}</lastmod>
    <changefreq>${escapeXML(url.changefreq)}</changefreq>
    <priority>${escapeXML(url.priority)}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;

await writeFile(new URL("sitemap.xml", publicDir), sitemap, "utf8");

console.log(`News sync complete: ${newsFeed.length} items, ${newsMeta.edition}, ${sitemapUrls.length} sitemap URLs.`);
