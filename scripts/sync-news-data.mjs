import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { allTimePsgPlayers, allTimePsgPlayersMeta } from "../src/all-time-psg-players.js";
import { editorialArticles, editorialArticlesMeta } from "../src/editorial-articles.js";
import { currentPlayerProfiles, legendProfiles, newsFeed, newsMeta, psgSchedule2627, staffProfiles } from "../src/site-data.js";

const siteUrl = "https://parisien90.com";
const publicDir = new URL("../public/", import.meta.url);
const newsDir = new URL("../news/", import.meta.url);
const dossiersDir = new URL("../dossiers-psg/", import.meta.url);
const playersDir = new URL("../joueurs-psg/", import.meta.url);
const legendsDir = new URL("../anciens-joueurs-psg/", import.meta.url);
const staffDir = new URL("../staff-psg/", import.meta.url);
const brDir = new URL("../br/", import.meta.url);
const currentDate = newsMeta.updatedAt.slice(0, 10);
const heroImage = `${siteUrl}/hero-stadium.png`;

const isPublishedNews = (item) =>
  !String(item.reliability || "").toLowerCase().includes("archive") &&
  !String(item.title || "").toLowerCase().startsWith("édition du");

const publishedNewsFeed = newsFeed.filter(isPublishedNews);

const staticPages = [
  { path: "/", changefreq: "hourly", priority: "1.0" },
  { path: "/transfert-psg/", changefreq: "hourly", priority: "1.0" },
  { path: "/mercato-psg/", changefreq: "hourly", priority: "0.95" },
  { path: "/actualite-psg/", changefreq: "hourly", priority: "0.9" },
  { path: "/dossiers-psg/", changefreq: "daily", priority: "0.88" },
  { path: "/viral-psg/", changefreq: "hourly", priority: "0.88" },
  { path: "/videos-psg/", changefreq: "weekly", priority: "0.78" },
  { path: "/calendrier-psg/", changefreq: "daily", priority: "0.75" },
  { path: "/joueurs-psg/", changefreq: "daily", priority: "0.75" },
  { path: "/records-psg/", changefreq: "weekly", priority: "0.86" },
  { path: "/charte-editoriale/", changefreq: "monthly", priority: "0.65" },
  { path: "/mentions-legales/", changefreq: "monthly", priority: "0.5" },
  { path: "/confidentialite/", changefreq: "monthly", priority: "0.5" },
  { path: "/cookies/", changefreq: "monthly", priority: "0.5" },
  { path: "/contact-retrait/", changefreq: "monthly", priority: "0.5" },
  { path: "/sources-psg/", changefreq: "weekly", priority: "0.7" },
  { path: "/histoire-psg/", changefreq: "weekly", priority: "0.85" },
  { path: "/anciens-joueurs-psg/", changefreq: "weekly", priority: "0.84" },
  { path: "/droits-disclaimer/", changefreq: "monthly", priority: "0.7" },
  { path: "/br/", changefreq: "daily", priority: "0.86" },
  { path: "/br/noticias-psg/", changefreq: "daily", priority: "0.82" },
  { path: "/br/transferencias-psg/", changefreq: "daily", priority: "0.78" },
  { path: "/br/mercado-psg/", changefreq: "daily", priority: "0.78" },
  { path: "/br/jogadores-psg/", changefreq: "weekly", priority: "0.72" },
  { path: "/br/historia-psg/", changefreq: "weekly", priority: "0.72" },
  { path: "/br/antigos-jogadores-psg/", changefreq: "weekly", priority: "0.74" },
  { path: "/br/brasileiros-no-psg/", changefreq: "weekly", priority: "0.8" },
  { path: "/br/dossies-psg/", changefreq: "weekly", priority: "0.76" },
  { path: "/br/dossies-psg/brasileiros-psg-alma-mundial-paris/", changefreq: "monthly", priority: "0.78" },
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
const brItemPath = (item) => `/br/noticias-psg/${slugify(item.id)}/`;
const brItemUrl = (item) => `${siteUrl}${brItemPath(item)}`;
const editorialPath = (item) => `/dossiers-psg/${slugify(item.id)}/`;
const editorialUrl = (item) => `${siteUrl}${editorialPath(item)}`;
const sourceUrl = (item) => new URL(item.url, siteUrl).href;
const currentPlayerPath = (profile) => `/joueurs-psg/${slugify(profile.id)}/`;
const currentPlayerUrl = (profile) => `${siteUrl}${currentPlayerPath(profile)}`;
const legendPath = (profile) => `/anciens-joueurs-psg/${slugify(profile.id)}/`;
const legendUrl = (profile) => `${siteUrl}${legendPath(profile)}`;
const staffPath = (profile) => `/staff-psg/${slugify(profile.id)}/`;
const staffUrl = (profile) => `${siteUrl}${staffPath(profile)}`;
const brCurrentPlayerPath = (profile) => `/br/jogadores-psg/${slugify(profile.id)}/`;
const brCurrentPlayerUrl = (profile) => `${siteUrl}${brCurrentPlayerPath(profile)}`;
const brLegendProfilePath = (profile) => `/br/antigos-jogadores-psg/${slugify(profile.id)}/`;
const brLegendProfileUrl = (profile) => `${siteUrl}${brLegendProfilePath(profile)}`;
const assetUrl = (path) => new URL(path, siteUrl).href;
const normalizeKey = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const splitCountries = (countries) =>
  String(countries || "")
    .split(",")
    .map((country) => country.trim())
    .filter(Boolean);

const countryKey = (country) => normalizeKey(country);

const getTopicPath = (item) => {
  const category = String(item.category || "").toLowerCase();
  const title = String(item.title || "").toLowerCase();
  if (category.includes("mercato") || title.includes("transfert")) return "/transfert-psg/";
  if (category.includes("calendrier") || category.includes("match") || category.includes("europe")) return "/calendrier-psg/";
  if (category.includes("effectif") || category.includes("staff") || category.includes("joueur")) return "/joueurs-psg/";
  if (category.includes("histoire") || category.includes("ancien")) return "/histoire-psg/";
  return "/actualite-psg/";
};

const freshnessSummary = publishedNewsFeed
  .slice(0, 5)
  .map((item) => item.title)
  .join(" ; ");

const getArticleAngle = (item) => {
  const category = String(item.category || "").toLowerCase();
  const title = String(item.title || "").toLowerCase();

  if (category.includes("mercato") || title.includes("transfert")) {
    return {
      label: "Mercato PSG",
      pillar: "/transfert-psg/",
      stakes: "Dans un mercato PSG, la vraie information n'est pas seulement le nom du joueur. C'est le degré d'avancement, la source, la logique sportive et ce que le mouvement changerait dans la rotation de Luis Enrique.",
      watch: "Le prochain signal fiable sera une confirmation club, un accord entre clubs, une visite médicale ou une prise de parole suffisamment attribuée. Tant que ce palier n'est pas franchi, Parisien 90 classe le dossier avec prudence."
    };
  }

  if (category.includes("calendrier") || category.includes("match") || category.includes("europe")) {
    return {
      label: "Calendrier PSG",
      pillar: "/calendrier-psg/",
      stakes: "Un match du PSG ne se lit pas seulement par son score. Il raconte l'état physique du groupe, les arbitrages de rotation et la manière dont Paris gère son statut dans une saison où chaque adversaire veut marquer son coup.",
      watch: "Les horaires, lieux, diffuseurs et statuts de compétition doivent rester vérifiés, car les calendriers peuvent bouger après décision de la LFP, de l'UEFA ou des clubs concernés."
    };
  }

  if (category.includes("effectif") || category.includes("staff") || category.includes("groupe") || category.includes("joueur")) {
    return {
      label: "Effectif PSG",
      pillar: "/joueurs-psg/",
      stakes: "L'effectif du PSG est une bataille permanente entre hiérarchie, temps de jeu, statut des cadres et place donnée aux jeunes. Une information de groupe peut donc peser plus lourd qu'elle n'en a l'air.",
      watch: "Les fiches joueurs et staff doivent être reliées aux sources officielles dès que le club actualise numéros, statuts, blessures ou composition du groupe."
    };
  }

  if (category.includes("histoire") || category.includes("ancien")) {
    return {
      label: "Histoire PSG",
      pillar: "/histoire-psg/",
      stakes: "L'actualité parisienne prend plus de sens quand elle est reliée à la mémoire du club : grands joueurs, choix de direction, ruptures sportives et cycles qui ont façonné l'identité du PSG.",
      watch: "Les anciens joueurs doivent être traités avec la même rigueur que l'actualité : période PSG, situation actuelle, statut public et sources recoupables."
    };
  }

  return {
    label: "Actualité PSG",
    pillar: "/actualite-psg/",
    stakes: "Une info PSG circule vite, mais elle ne vaut que si elle est datée, sourcée et replacée dans le contexte sportif du club. L'objectif est de rendre le signal lisible sans reprendre le contenu original.",
    watch: "Parisien 90 distingue l'information établie, la rumeur, l'analyse et l'opinion afin de garder un ton vivant sans brouiller la frontière entre fait et commentaire."
  };
};

const makeArticleSections = (item) => {
  const angle = getArticleAngle(item);
  const source = escapeHTML(item.source);
  const title = escapeHTML(item.title);
  const summary = escapeHTML(item.summary);
  const reliability = escapeHTML(item.reliability);

  return `<h2>Ce qui est établi</h2>
            <p>${summary}</p>
            <p>Le point important, ici, est la nature du signal : il est daté du ${escapeHTML(item.dateLabel || newsMeta.displayDate)} à ${escapeHTML(item.time)} et classé <strong>${reliability}</strong>. Cette qualification permet de ne pas mettre sur le même plan une annonce officielle, une rumeur de marché, une analyse maison ou une reprise à confirmer.</p>
            <h2>Pourquoi cette info compte pour le PSG</h2>
            <p>${escapeHTML(angle.stakes)}</p>
            <p>Pour les supporters, ${title} n'est donc pas une simple ligne de fil d'actualité. C'est une pièce du récit parisien : effectif, rythme de saison, rapport de force du mercato, statut des cadres ou crédibilité sportive du projet.</p>
            <h2>La lecture Parisien 90</h2>
            <p>Notre angle est volontairement direct : donner l'information utile, la rendre lisible et pointer ce qui peut faire débat sans transformer une hypothèse en certitude. Quand une formulation est polémique, elle doit rester identifiable comme une lecture éditoriale, pas comme un fait nouveau.</p>
            <p>${escapeHTML(angle.watch)}</p>
            <h2>Ce que les supporters doivent surveiller</h2>
            <p>La suite dépendra souvent d'un détail concret : une nouvelle convocation, un communiqué, une programmation, une évolution de prix, une image d'entraînement, un changement de groupe ou une confirmation d'instance. C'est précisément ce type de signal que Parisien 90 relie au fil live et aux dossiers de fond.</p>
            <p>Cette approche permet de garder une page utile après la première vague de partage : le lecteur peut revenir, retrouver l'heure de publication, vérifier la source et comprendre pourquoi l'information a été classée dans ce dossier PSG.</p>
            <h2>À lire ensuite sur Parisien 90</h2>
            <p>Pour prolonger cette info sans repartir de zéro, Parisien 90 renvoie vers les pages utiles du site : <a href="/mercato-psg/">psg mercato</a>, <a href="/transfert-psg/">psg transfert</a>, <a href="/calendrier-psg/">calendrier PSG</a>, <a href="/records-psg/">records PSG</a> et <a href="/anciens-joueurs-psg/ronaldinho/">Ronaldinho PSG</a>. Le lecteur peut ainsi passer d'une information chaude à un contexte plus complet sur le club.</p>
            <h2>Source, droits et méthode</h2>
            <p>Cette page ne reproduit pas l'article d'origine. Elle propose une synthèse originale et renvoie vers <strong>${source}</strong>, afin que le lecteur puisse vérifier le signal de départ. Les faits bruts, dates, scores, mouvements et informations publiques sont reformulés ; les contenus tiers protégés ne sont pas recopiés.</p>`;
};

const makeArticlePage = (item) => {
  const url = itemUrl(item);
  const dateTime = itemDateTimeISO(item);
  const related = publishedNewsFeed
    .filter((candidate) => candidate.id !== item.id && candidate.category === item.category)
    .slice(0, 4);
  const title = `${item.title} | Parisien 90`;
  const description = `${item.summary} Source : ${item.source}.`;
  const topicPath = getTopicPath(item);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "NewsArticle",
        "@id": `${url}#article`,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        headline: item.title,
        description: item.summary,
        image: [heroImage],
        datePublished: dateTime,
        dateModified: newsMeta.updatedAt,
        inLanguage: "fr-FR",
        articleSection: item.category,
        keywords: ["PSG", "Paris Saint-Germain", "actualité PSG", "transfert PSG", "mercato PSG", "calendrier PSG", "records PSG", "Ronaldinho PSG", item.category],
        wordCount: 680,
        isAccessibleForFree: true,
        author: { "@type": "Organization", name: "Parisien 90", url: siteUrl },
        publisher: {
          "@type": "NewsMediaOrganization",
          name: "Parisien 90",
          url: siteUrl,
          logo: { "@type": "ImageObject", url: heroImage }
        },
        copyrightHolder: { "@type": "Organization", name: "Parisien 90" },
        isBasedOn: { "@type": "CreativeWork", name: item.source, url: sourceUrl(item) },
        about: { "@type": "SportsTeam", name: "Paris Saint-Germain" }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Accueil", item: `${siteUrl}/` },
          { "@type": "ListItem", position: 2, name: "Actualité PSG", item: `${siteUrl}/actualite-psg/` },
          { "@type": "ListItem", position: 3, name: item.title, item: url }
        ]
      }
    ]
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
        <a href="/dossiers-psg/">Dossiers</a>
        <a href="/viral-psg/">Viral</a>
        <a href="/videos-psg/">Vidéos</a>
        <a href="/calendrier-psg/">Calendrier</a>
        <a href="/joueurs-psg/">Joueurs</a>
        <a href="/records-psg/">Records</a>
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
            ${makeArticleSections(item)}
            <div class="source-box">
              <span>Source citée</span>
              <a href="${escapeHTML(sourceUrl(item))}" rel="noopener noreferrer">${escapeHTML(item.source)}</a>
            </div>
          </div>
          <aside class="article-sidebar">
            <span class="section-kicker">Guides PSG à lire ensuite</span>
            <a href="${escapeHTML(topicPath)}">Guide prioritaire de ce dossier</a>
            <a href="/transfert-psg/">Transfert PSG : arrivées, départs et rumeurs</a>
            <a href="/mercato-psg/">Mercato PSG en direct : méthode et fiabilité</a>
            <a href="/dossiers-psg/">Dossiers PSG : analyses originales et histoire</a>
            <a href="/calendrier-psg/">Calendrier PSG complet 2026-2027</a>
            <a href="/joueurs-psg/">Joueurs PSG : effectif, fiches et staff</a>
            <a href="/records-psg/">Records PSG : buteurs, capés et chiffres forts</a>
            <a href="/anciens-joueurs-psg/ronaldinho/">Ronaldinho PSG : fiche star mondiale</a>
            <a href="/sources-psg/">Sources PSG : vérification et droits</a>
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

const makeEditorialArticlePage = (item) => {
  const path = editorialPath(item);
  const url = editorialUrl(item);
  const dateTime = `${item.date}T${String(item.time || "09:00").padStart(5, "0")}:00+02:00`;
  const sourceItems = (item.sources || []).map((source) => ({
    "@type": "CreativeWork",
    name: source.name,
    url: new URL(source.url, siteUrl).href
  }));
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        headline: item.title,
        description: item.description,
        image: [new URL(item.image || "/hero-stadium.png", siteUrl).href],
        datePublished: dateTime,
        dateModified: editorialArticlesMeta.updatedAt,
        inLanguage: "fr-FR",
        articleSection: item.category,
        keywords: item.keywords,
        author: { "@type": "Organization", name: item.author || "Rédaction Parisien 90", url: siteUrl },
        publisher: {
          "@type": "NewsMediaOrganization",
          name: "Parisien 90",
          url: siteUrl,
          logo: { "@type": "ImageObject", url: heroImage }
        },
        isAccessibleForFree: true,
        copyrightHolder: { "@type": "Organization", name: "Parisien 90" },
        about: { "@type": "SportsTeam", name: "Paris Saint-Germain" },
        isBasedOn: sourceItems
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Accueil", item: `${siteUrl}/` },
          { "@type": "ListItem", position: 2, name: "Dossiers PSG", item: `${siteUrl}/dossiers-psg/` },
          { "@type": "ListItem", position: 3, name: item.title, item: url }
        ]
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: (item.faq || []).map((entry) => ({
          "@type": "Question",
          name: entry.question,
          acceptedAnswer: { "@type": "Answer", text: entry.answer }
        }))
      }
    ]
  };
  const sections = (item.sections || [])
    .map(
      (section) => `<section class="records-section">
              <h2>${escapeHTML(section.heading)}</h2>
              ${section.paragraphs.map((paragraph) => `<p>${escapeHTML(paragraph)}</p>`).join("\n              ")}
            </section>`
    )
    .join("\n");
  const sourceLinks = (item.sources || [])
    .map((source) => `<li><a href="${escapeHTML(new URL(source.url, siteUrl).href)}" rel="noopener noreferrer">${escapeHTML(source.name)}</a><span>${escapeHTML(source.note)}</span></li>`)
    .join("\n");
  const internalLinks = (item.internalLinks || [])
    .map((link) => `<a href="${escapeHTML(link.url)}">${escapeHTML(link.label)}</a>`)
    .join("\n");
  const faqMarkup = (item.faq || [])
    .map((entry, index) => `<details${index === 0 ? " open" : ""}>
                <summary>${escapeHTML(entry.question)}</summary>
                <p>${escapeHTML(entry.answer)}</p>
              </details>`)
    .join("\n");

  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHTML(item.title)} | Parisien 90</title>
    <meta name="description" content="${escapeHTML(item.description)}" />
    <link rel="canonical" href="${escapeHTML(url)}" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="apple-touch-icon" href="/icons/parisien-90-app-icon.svg" />
    <meta name="theme-color" content="#071426" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${escapeHTML(item.title)}" />
    <meta property="og:description" content="${escapeHTML(item.description)}" />
    <meta property="og:url" content="${escapeHTML(url)}" />
    <meta property="og:image" content="${escapeHTML(new URL(item.image || "/hero-stadium.png", siteUrl).href)}" />
    <meta property="article:published_time" content="${escapeHTML(dateTime)}" />
    <meta property="article:modified_time" content="${escapeHTML(editorialArticlesMeta.updatedAt)}" />
    <meta property="article:section" content="${escapeHTML(item.category)}" />
    <meta name="twitter:card" content="summary_large_image" />
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
        <a href="/dossiers-psg/" aria-current="page">Dossiers</a>
        <a href="/viral-psg/">Viral</a>
        <a href="/videos-psg/">Vidéos</a>
        <a href="/calendrier-psg/">Calendrier</a>
        <a href="/joueurs-psg/">Joueurs</a>
        <a href="/records-psg/">Records</a>
        <a href="/histoire-psg/">Histoire</a>
        <a href="/sources-psg/">Sources</a>
      </nav>
    </header>
    <main>
      <nav class="breadcrumb" aria-label="Fil d'Ariane"><a href="/">Accueil</a><span>/</span><a href="/dossiers-psg/">Dossiers PSG</a><span>/</span><span>${escapeHTML(item.category)}</span></nav>
      <article class="article-page records-page" data-share-title="${escapeHTML(item.title)}" data-share-url="${escapeHTML(path)}">
        <div class="article-hero">
          <div class="item-tags"><span>${escapeHTML(item.category)}</span><span>${escapeHTML(item.angle)}</span><span>${escapeHTML(item.readingTime)}</span></div>
          <time datetime="${escapeHTML(dateTime)}">${escapeHTML(item.dateLabel)} · ${escapeHTML(item.time)}</time>
          <h1>${escapeHTML(item.title)}</h1>
          <p>${escapeHTML(item.deck)}</p>
        </div>
        <div class="article-layout">
          <div class="article-body">
            ${sections}
            <section class="records-section">
              <h2>FAQ</h2>
              <div class="faq-list">
                ${faqMarkup}
              </div>
            </section>
            <section class="source-box">
              <span>Sources utilisées et méthode</span>
              <p>${escapeHTML(editorialArticlesMeta.rightsNote)}</p>
              <ul class="source-credit-list">
                ${sourceLinks}
              </ul>
            </section>
          </div>
          <aside class="article-sidebar">
            <figure class="profile-photo-card">
              <img src="${escapeHTML(item.image || "/hero-stadium.png")}" alt="${escapeHTML(item.imageAlt || item.title)}" loading="eager" decoding="async" />
              <figcaption>${escapeHTML(item.imageCredit || "Image éditoriale Parisien 90")}${item.imageLicenseUrl ? ` - <a href="${escapeHTML(item.imageLicenseUrl)}" rel="noopener noreferrer">licence</a>` : ""}. Usage éditorial, aucune affiliation suggérée.</figcaption>
            </figure>
            <span class="section-kicker">À lire aussi</span>
            ${internalLinks}
            <a href="/dossiers-psg/">Tous les dossiers PSG</a>
            <a href="/sources-psg/">Sources PSG</a>
            <a href="/droits-disclaimer/">Droits & disclaimer</a>
          </aside>
        </div>
      </article>
    </main>
    <footer class="site-footer">
      <p>Parisien 90 - dossiers originaux PSG, analyses et histoire du Paris Saint-Germain.</p>
      <a href="/dossiers-psg/">Dossiers PSG</a>
      <a href="/charte-editoriale/">Charte éditoriale</a>
      <a href="/mentions-legales/">Mentions légales</a>
      <a href="/contact-retrait/">Contact</a>
      <a href="/droits-disclaimer/">Droits & disclaimer</a>
    </footer>
    <script type="module" src="/src/site.js"></script>
  </body>
</html>
`;
};

const makeEditorialIndexPage = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${siteUrl}/dossiers-psg/#page`,
        url: `${siteUrl}/dossiers-psg/`,
        name: "Dossiers PSG",
        description: "Articles de fond originaux sur le PSG : anciens joueurs, effectif, histoire, mercato et débats.",
        inLanguage: "fr-FR",
        dateModified: editorialArticlesMeta.updatedAt,
        about: { "@type": "SportsTeam", name: "Paris Saint-Germain" },
        publisher: { "@type": "NewsMediaOrganization", name: "Parisien 90", url: siteUrl }
      },
      {
        "@type": "ItemList",
        name: "Dossiers PSG originaux",
        itemListElement: editorialArticles.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.title,
          url: editorialUrl(item)
        }))
      }
    ]
  };
  const cards = editorialArticles
    .map(
      (item) => `<article class="news-card" data-share-title="${escapeHTML(item.title)}" data-share-url="${escapeHTML(editorialPath(item))}">
            <time class="news-date" datetime="${escapeHTML(`${item.date}T${item.time}:00+02:00`)}">${escapeHTML(item.dateLabel)} · ${escapeHTML(item.time)}</time>
            <div class="news-topline"><span>${escapeHTML(item.category)}</span><strong>${escapeHTML(item.angle)}</strong></div>
            <h3><a href="${escapeHTML(editorialPath(item))}">${escapeHTML(item.title)}</a></h3>
            <p>${escapeHTML(item.deck)}</p>
            <a href="${escapeHTML(editorialPath(item))}">Lire le dossier</a>
          </article>`
    )
    .join("\n");

  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Dossiers PSG : analyses originales, histoire et joueurs | Parisien 90</title>
    <meta name="description" content="Dossiers PSG originaux : articles de fond sur les anciens joueurs, l'effectif, le mercato, l'histoire du Paris Saint-Germain et les débats du club." />
    <link rel="canonical" href="https://parisien90.com/dossiers-psg/" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="apple-touch-icon" href="/icons/parisien-90-app-icon.svg" />
    <meta name="theme-color" content="#071426" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Dossiers PSG : analyses originales, histoire et joueurs | Parisien 90" />
    <meta property="og:description" content="Articles de fond PSG : histoire, joueurs, mercato, débats et mémoire du club." />
    <meta property="og:image" content="https://parisien90.com/hero-stadium.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <script type="application/ld+json">${safeJson(jsonLd)}</script>
    <link rel="stylesheet" href="/src/styles.css" />
  </head>
  <body>
    <header class="site-header">
      <a class="brand" href="/" aria-label="Parisien 90"><span class="brand-mark">P90</span><span><strong>Parisien 90</strong><small>PSG live desk</small></span></a>
      <nav class="main-nav" aria-label="Navigation principale">
        <a href="/transfert-psg/">Transfert PSG</a>
        <a href="/mercato-psg/">Mercato PSG</a>
        <a href="/actualite-psg/">Actualité PSG</a>
        <a href="/dossiers-psg/" aria-current="page">Dossiers</a>
        <a href="/viral-psg/">Viral</a>
        <a href="/videos-psg/">Vidéos</a>
        <a href="/calendrier-psg/">Calendrier</a>
        <a href="/joueurs-psg/">Joueurs</a>
        <a href="/records-psg/">Records</a>
        <a href="/histoire-psg/">Histoire</a>
        <a href="/sources-psg/">Sources</a>
      </nav>
    </header>
    <main>
      <nav class="breadcrumb" aria-label="Fil d'Ariane"><a href="/">Accueil</a><span>/</span><span>Dossiers PSG</span></nav>
      <section class="page-hero">
        <span class="section-kicker">Articles de fond · ${escapeHTML(editorialArticlesMeta.displayDate)}</span>
        <h1>Dossiers PSG : analyses originales pour supporters exigeants</h1>
        <p>
          Des articles de fond pour les supporters qui veulent aller plus loin : anciens joueurs, effectif actuel,
          histoire, mercato, débats et récits qui donnent du relief à l'actualité parisienne.
        </p>
      </section>
      <section class="content-section">
        <span class="section-kicker">Ligne éditoriale</span>
        <h2>Original, sourcé, utile et partageable</h2>
        <p>
          Ces dossiers ne recopient pas Wikipedia, les médias ou les fiches officielles. Ils utilisent des sources
          factuelles citées, puis ajoutent un angle Parisien 90 : lecture sportive, débat, contexte historique et
          liens vers les grands dossiers du site.
        </p>
        <div class="method-list">
          <article><strong>Historique</strong><p>Anciennes stars, grands joueurs, records, nationalités et mémoire du club.</p></article>
          <article><strong>Actuel</strong><p>Joueurs, staff, rotation, calendrier, blessures, concurrence et conséquences mercato.</p></article>
          <article><strong>Opinion</strong><p>Sujets qui font discuter sans brouiller la frontière entre fait, analyse et polémique.</p></article>
        </div>
      </section>
      <section class="content-section">
        <div class="section-heading">
          <div>
            <span class="section-kicker">À lire aujourd'hui</span>
            <h2>Les derniers dossiers PSG</h2>
          </div>
          <span class="freshness">${escapeHTML(editorialArticles.length)} dossiers publiés</span>
        </div>
        <div class="hot-grid">
          ${cards}
        </div>
      </section>
    </main>
    <footer class="site-footer"><p>Parisien 90 - dossiers originaux PSG.</p><a href="/actualite-psg/">Actualité PSG</a><a href="/charte-editoriale/">Charte éditoriale</a><a href="/mentions-legales/">Mentions légales</a><a href="/contact-retrait/">Contact</a><a href="/droits-disclaimer/">Droits & disclaimer</a></footer>
    <script type="module" src="/src/site.js"></script>
  </body>
</html>
`;
};

const makeProfilePage = ({ profile, type, path, url, parentPath, parentName }) => {
  const isPlayer = type === "player";
  const isLegend = type === "legend";
  const profileImage = profile.image ? assetUrl(profile.image.url) : heroImage;
  const title = isPlayer
    ? `${profile.name} PSG : fiche joueur, poste, statut et source | Parisien 90`
    : isLegend
      ? `${profile.name} PSG : ancien joueur, histoire et situation actuelle | Parisien 90`
      : `${profile.name} PSG : fiche staff, rôle et mission | Parisien 90`;
  const description = isPlayer
    ? `${profile.name}, ${profile.position} du PSG : numéro ${profile.number}, rôle, statut, point à surveiller et source de mise à jour.`
    : isLegend
      ? `${profile.name}, ancien du PSG : période parisienne, rôle, statut public, situation actuelle et importance dans l'histoire du club.`
      : `${profile.name}, ${profile.role} du staff PSG : mission, statut, point de vigilance et source.`;
  const tags = [
    profile.number ? `N° ${profile.number}` : null,
    profile.position,
    profile.role,
    profile.line,
    profile.status,
    profile.lifeStatus,
    profile.psgPeriod
  ].filter(Boolean);
  const facts = [
    ["Nom", profile.name],
    ["Statut", profile.status || profile.lifeStatus],
    ["Poste", profile.position],
    ["Rôle", profile.role],
    ["Ligne", profile.line],
    ["Numéro", profile.number],
    ["Période PSG", profile.psgPeriod],
    ["Vie actuelle", profile.currentLife],
    ["Point à surveiller", profile.watch],
    ["Requêtes associées", Array.isArray(profile.aliases) ? profile.aliases.join(", ") : profile.aliases],
    ["Photo", profile.image ? `${profile.image.credit} - ${profile.image.license}` : null],
    ["Dernière mise à jour", profile.updatedAt],
    ["Source", profile.source || "Synthèse éditoriale Parisien 90"]
  ].filter(([, value]) => value);
  const photoMarkup = profile.image
    ? `<figure class="profile-photo-card">
              <img src="${escapeHTML(profile.image.url)}" alt="${escapeHTML(profile.image.alt || profile.name)}" loading="eager" decoding="async" />
              <figcaption>
                Photo : <a href="${escapeHTML(profile.image.sourceUrl)}" rel="noopener noreferrer">${escapeHTML(profile.image.credit)}</a>,
                <a href="${escapeHTML(profile.image.licenseUrl)}" rel="noopener noreferrer">${escapeHTML(profile.image.license)}</a>.
                Usage éditorial, aucune affiliation suggérée.
              </figcaption>
            </figure>`
    : "";
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": `${url}#profile`,
        url,
        name: title,
        description,
        dateModified: newsMeta.updatedAt,
        inLanguage: "fr-FR",
        primaryImageOfPage: profile.image ? { "@type": "ImageObject", url: profileImage, creditText: profile.image.credit, license: profile.image.licenseUrl } : undefined,
        about: {
          "@type": "Person",
          name: profile.name,
          jobTitle: profile.role || profile.position,
          alternateName: profile.aliases,
          image: profile.image ? profileImage : undefined,
          memberOf: { "@type": "SportsTeam", name: "Paris Saint-Germain" }
        },
        publisher: { "@type": "NewsMediaOrganization", name: "Parisien 90", url: siteUrl }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Accueil", item: `${siteUrl}/` },
          { "@type": "ListItem", position: 2, name: parentName, item: `${siteUrl}${parentPath}` },
          { "@type": "ListItem", position: 3, name: profile.name, item: url }
        ]
      }
    ]
  };
  if (Array.isArray(profile.faq) && profile.faq.length) {
    jsonLd["@graph"].push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: profile.faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer }
      }))
    });
  }
  const editorialFocusMarkup = Array.isArray(profile.editorialFocus) && profile.editorialFocus.length
    ? `<h2>${escapeHTML(profile.editorialFocusTitle || `${profile.name} PSG : pourquoi cette fiche compte`)}</h2>
            ${profile.editorialFocus.map((paragraph) => `<p>${escapeHTML(paragraph)}</p>`).join("\n            ")}`
    : "";
  const faqMarkup = Array.isArray(profile.faq) && profile.faq.length
    ? `<h2>FAQ ${escapeHTML(profile.name)} PSG</h2>
            <div class="faq-list">
              ${profile.faq.map((item, index) => `<details${index === 0 ? " open" : ""}>
                <summary>${escapeHTML(item.question)}</summary>
                <p>${escapeHTML(item.answer)}</p>
              </details>`).join("\n              ")}
            </div>`
    : "";

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
    <meta property="og:type" content="profile" />
    <meta property="og:title" content="${escapeHTML(title)}" />
    <meta property="og:description" content="${escapeHTML(description)}" />
    <meta property="og:url" content="${escapeHTML(url)}" />
    <meta property="og:image" content="${escapeHTML(profileImage)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="${escapeHTML(profileImage)}" />
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
        <a href="/dossiers-psg/">Dossiers</a>
        <a href="/viral-psg/">Viral</a>
        <a href="/videos-psg/">Vidéos</a>
        <a href="/calendrier-psg/">Calendrier</a>
        <a href="/joueurs-psg/"${isPlayer || type === "staff" ? ' aria-current="page"' : ""}>Joueurs</a>
        <a href="/records-psg/">Records</a>
        <a href="/histoire-psg/"${isLegend ? ' aria-current="page"' : ""}>Histoire</a>
        <a href="/sources-psg/">Sources</a>
      </nav>
    </header>
    <main>
      <nav class="breadcrumb" aria-label="Fil d'Ariane"><a href="/">Accueil</a><span>/</span><a href="${escapeHTML(parentPath)}">${escapeHTML(parentName)}</a><span>/</span><span>${escapeHTML(profile.name)}</span></nav>
      <article class="profile-page article-page" data-share-title="${escapeHTML(title)}" data-share-url="${escapeHTML(path)}">
        <div class="article-hero">
          <div class="item-tags">${tags.map((tag) => `<span>${escapeHTML(tag)}</span>`).join("")}</div>
          <time datetime="${escapeHTML(newsMeta.updatedAt)}">Mis à jour le ${escapeHTML(profile.updatedAt || newsMeta.displayDate)}</time>
          <h1>${escapeHTML(profile.name)}</h1>
          <p>${escapeHTML(profile.profile || profile.whyMatters || description)}</p>
        </div>
        <div class="article-layout">
          <div class="article-body">
            <h2>Fiche synthèse</h2>
            <dl class="profile-facts is-page">
              ${facts.map(([label, value]) => `<div><dt>${escapeHTML(label)}</dt><dd>${escapeHTML(value)}</dd></div>`).join("")}
            </dl>
            <h2>Pourquoi cette fiche compte</h2>
            <p>${escapeHTML(profile.whyMatters || profile.watch || "Cette fiche sert de repère stable pour suivre le rôle public de ce profil dans l'écosystème du Paris Saint-Germain.")}</p>
            <p>Parisien 90 maintient cette page comme une fiche évolutive : elle peut être enrichie par les sources officielles, les communiqués de club, les archives publiques et les informations recoupées.</p>
            ${editorialFocusMarkup}
            ${faqMarkup}
            <h2>Méthode et prudence</h2>
            <p>Les informations personnelles sensibles ne sont pas utilisées. Les données affichées restent limitées à l'intérêt sportif, historique ou éditorial : poste, rôle, période PSG, statut public et source de vérification.</p>
          </div>
          <aside class="article-sidebar">
            ${photoMarkup}
            <span class="section-kicker">Continuer</span>
            <a href="/joueurs-psg/">Effectif PSG</a>
            <a href="/records-psg/">Records PSG</a>
            <a href="/dossiers-psg/">Dossiers PSG</a>
            <a href="/histoire-psg/">Histoire du PSG</a>
            <a href="/actualite-psg/">Actualité PSG</a>
            <a href="/sources-psg/">Sources utilisées</a>
            <a href="/contact-retrait/">Signaler une correction</a>
          </aside>
        </div>
      </article>
    </main>
    <footer class="site-footer">
      <p>Parisien 90 - fiche PSG indépendante.</p>
      <a href="/charte-editoriale/">Charte éditoriale</a>
      <a href="/droits-disclaimer/">Droits & disclaimer</a>
      <a href="/contact-retrait/">Contact</a>
    </footer>
    <script type="module" src="/src/site.js"></script>
  </body>
  </html>
`;
};

const getProfilePositionGroup = (profile) => {
  const value = `${profile.position || ""} ${profile.role || ""} ${profile.line || ""}`.toLowerCase();
  if (value.includes("gardien")) return "Gardien";
  if (value.includes("défenseur") || value.includes("defenseur") || value.includes("latéral") || value.includes("central")) return "Défenseur";
  if (value.includes("milieu")) return "Milieu";
  if (value.includes("attaquant") || value.includes("ailier") || value.includes("avant-centre")) return "Attaquant";
  return "Joueur de champ";
};

const editorialCountryByName = new Map(
  [
    ["Achraf Hakimi", "Maroc"],
    ["Alain Roche", "France"],
    ["Alex", "Brésil"],
    ["Alphonse Areola", "France"],
    ["Ángel Di María", "Argentine"],
    ["Bernard Lama", "France"],
    ["Blaise Matuidi", "France"],
    ["Carlos Bianchi", "Argentine"],
    ["Christopher Nkunku", "France"],
    ["Claude Makélélé", "France"],
    ["Dani Alves", "Brésil"],
    ["Daniel Bravo", "France"],
    ["David Beckham", "Angleterre"],
    ["David Ginola", "France"],
    ["David Luiz", "Brésil"],
    ["Dominique Baratelli", "France"],
    ["Dominique Bathenay", "France"],
    ["Dominique Rocheteau", "France"],
    ["Edinson Cavani", "Uruguay"],
    ["Ezequiel Lavezzi", "Argentine"],
    ["George Weah", "Liberia"],
    ["Gianluigi Buffon", "Italie"],
    ["Gianluigi Donnarumma", "Italie"],
    ["Guillaume Hoarau", "France"],
    ["Hatem Ben Arfa", "France"],
    ["Javier Pastore", "Argentine"],
    ["Jean-Marc Pilorget", "France"],
    ["Jérémy Ménez", "France"],
    ["Jérôme Rothen", "France"],
    ["Joël Bats", "France"],
    ["Jay-Jay Okocha", "Nigeria"],
    ["Kevin Gameiro", "France"],
    ["Keylor Navas", "Costa Rica"],
    ["Kingsley Coman", "France"],
    ["Kylian Mbappé", "France"],
    ["Laurent Fournier", "France"],
    ["Leandro Paredes", "Argentine"],
    ["Leonardo", "Brésil"],
    ["Lionel Messi", "Argentine"],
    ["Luis Fernandez", "France"],
    ["Lucas Moura", "Brésil"],
    ["Marco Verratti", "Italie"],
    ["Marquinhos", "Brésil"],
    ["Mamadou Sakho", "France"],
    ["Mauro Icardi", "Argentine"],
    ["Maxwell", "Brésil"],
    ["Mikel Arteta", "Espagne"],
    ["Mustapha Dahleb", "Algérie"],
    ["Nenê", "Brésil"],
    ["Neymar", "Brésil"],
    ["Nicolas Anelka", "France"],
    ["Osvaldo Ardiles", "Argentine"],
    ["Ousmane Dembélé", "France"],
    ["Pauleta", "Portugal"],
    ["Paul Le Guen", "France"],
    ["Presnel Kimpembe", "France"],
    ["Raí", "Brésil"],
    ["Ronaldinho Gaúcho", "Brésil"],
    ["Safet Susic", "Bosnie-Herzégovine"],
    ["Salvatore Sirigu", "Italie"],
    ["Sergio Ramos", "Espagne"],
    ["Sylvain Armand", "France"],
    ["Thiago Motta", "Italie"],
    ["Thiago Silva", "Brésil"],
    ["Valdo", "Brésil"],
    ["Vincent Guérin", "France"],
    ["Vitinha", "Portugal"],
    ["Warren Zaïre-Emery", "France"],
    ["Youri Djorkaeff", "France"],
    ["Zlatan Ibrahimovic", "Suède"],
    ["Zoumana Camara", "France"]
  ].map(([name, country]) => [normalizeKey(name), country])
);

const buildAllTimePlayerIndex = (profilePages) => {
  const rows = [];
  const byKey = new Map();

  const addRow = (row) => {
    const key = normalizeKey(row.name);
    if (!key || byKey.has(key)) return;
    byKey.set(key, rows.length);
    rows.push(row);
  };

  allTimePsgPlayers.forEach((player) => {
    addRow({
      ...player,
      profilePath: null,
      profileUrl: null,
      profileType: null,
      sourceName: allTimePsgPlayersMeta.sourceName
    });
  });

  profilePages
    .filter((page) => page.type === "legend" || page.type === "player")
    .forEach((page) => {
      const profile = page.profile;
      const keys = [profile.name, ...(profile.aliases || [])].map(normalizeKey).filter(Boolean);
      const existingIndex = keys.map((key) => byKey.get(key)).find((index) => Number.isInteger(index));
      const existing = Number.isInteger(existingIndex) ? rows[existingIndex] : null;
      const editorialCountry = keys.map((key) => editorialCountryByName.get(key)).find(Boolean);
      const merged = {
        id: slugify(profile.id),
        name: profile.name,
        period: profile.psgPeriod || profile.status || "Période à vérifier",
        positionGroup: getProfilePositionGroup(profile),
        countries: profile.countries || editorialCountry || existing?.countries || "Pays à vérifier",
        source: profile.source || "Synthèse éditoriale Parisien 90",
        sourceName: profile.source || "Parisien 90",
        profilePath: page.path,
        profileUrl: page.url,
        profileType: page.type
      };

      if (Number.isInteger(existingIndex)) {
        rows[existingIndex] = { ...rows[existingIndex], ...merged, source: rows[existingIndex].source };
        keys.forEach((key) => byKey.set(key, existingIndex));
        return;
      }

      addRow(merged);
      const newIndex = rows.length - 1;
      keys.forEach((key) => byKey.set(key, newIndex));
    });

  return rows.sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));
};

const makeAllTimePlayersPage = (players) => {
  const profiledCount = players.filter((player) => player.profilePath).length;
  const positions = ["Tous", "Gardien", "Défenseur", "Milieu", "Attaquant", "Joueur de champ", "Poste à vérifier"];
  const countryCounts = new Map();
  players.forEach((player) => {
    splitCountries(player.countries).forEach((country) => {
      const key = countryKey(country);
      if (!key) return;
      const existing = countryCounts.get(key) || { label: country, count: 0 };
      existing.count += 1;
      countryCounts.set(key, existing);
    });
  });
  const countries = Array.from(countryCounts.values()).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.label.localeCompare(b.label, "fr", { sensitivity: "base" });
  });
  const countryOptions = [{ label: "Tous", value: "all", count: players.length }, ...countries];
  const getCountryCount = (label) => countryCounts.get(countryKey(label))?.count || 0;
  const rows = players
    .map((player) => {
      const sourceLink = String(player.source || "").startsWith("http")
        ? `<a href="${escapeHTML(player.source)}" rel="noopener noreferrer">Wikidata</a>`
        : escapeHTML(player.sourceName || player.source || "Parisien 90");
      const profileLink = player.profilePath
        ? `<a class="table-action" href="${escapeHTML(player.profilePath)}">Fiche longue</a>`
        : sourceLink;
      const rawSearchText = `${player.name} ${player.period} ${player.positionGroup} ${player.countries}`;
      const searchText = `${rawSearchText} ${normalizeKey(rawSearchText)}`.toLowerCase();
      const countryKeys = splitCountries(player.countries).map(countryKey).filter(Boolean);

      return `<tr data-all-time-row data-position="${escapeHTML(player.positionGroup)}" data-profile="${player.profilePath ? "yes" : "no"}" data-country="${escapeHTML(countryKeys.join("|"))}" data-search="${escapeHTML(searchText)}">
                  <td><strong>${escapeHTML(player.name)}</strong></td>
                  <td>${escapeHTML(player.period)}</td>
                  <td>${escapeHTML(player.positionGroup)}</td>
                  <td>${escapeHTML(player.countries)}</td>
                  <td>${profileLink}</td>
                </tr>`;
    })
    .join("\n");
  const itemList = players.slice(0, 300).map((player, index) => ({
    "@type": "ListItem",
    position: index + 1,
    item: {
      "@type": "Person",
      name: player.name,
      url: player.profileUrl || player.source || `${siteUrl}/anciens-joueurs-psg/`
    }
  }));
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${siteUrl}/anciens-joueurs-psg/#collection`,
        url: `${siteUrl}/anciens-joueurs-psg/`,
        name: "Anciens joueurs PSG : liste complète A-Z",
        description: "Index ouvert et enrichi des joueurs passés par le Paris Saint-Germain, avec fiches longues pour les grands noms.",
        inLanguage: "fr-FR",
        dateModified: newsMeta.updatedAt,
        about: { "@type": "SportsTeam", name: "Paris Saint-Germain" },
        publisher: { "@type": "NewsMediaOrganization", name: "Parisien 90", url: siteUrl }
      },
      {
        "@type": "ItemList",
        "@id": `${siteUrl}/anciens-joueurs-psg/#liste-joueurs`,
        name: "Liste des joueurs passés par le PSG",
        numberOfItems: players.length,
        itemListElement: itemList
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${siteUrl}/anciens-joueurs-psg/#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Accueil", item: `${siteUrl}/` },
          { "@type": "ListItem", position: 2, name: "Histoire PSG", item: `${siteUrl}/histoire-psg/` },
          { "@type": "ListItem", position: 3, name: "Anciens joueurs PSG", item: `${siteUrl}/anciens-joueurs-psg/` }
        ]
      }
    ]
  };

  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Anciens joueurs PSG : liste complète, Messi, Neymar, Mbappé | Parisien 90</title>
    <meta name="description" content="Liste complète des anciens joueurs PSG et grands noms passés par Paris : Messi, Neymar, Mbappé, Ronaldinho, Zlatan, Beckham, Raí, Pauleta et toutes les fiches disponibles." />
    <link rel="canonical" href="${siteUrl}/anciens-joueurs-psg/" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="apple-touch-icon" href="/icons/parisien-90-app-icon.svg" />
    <meta name="theme-color" content="#071426" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Anciens joueurs PSG : liste complète A-Z | Parisien 90" />
    <meta property="og:description" content="Index ouvert des joueurs passés par le PSG, enrichi avec des fiches longues et des repères historiques." />
    <meta property="og:url" content="${siteUrl}/anciens-joueurs-psg/" />
    <meta property="og:image" content="${heroImage}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="${heroImage}" />
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
        <a href="/dossiers-psg/">Dossiers</a>
        <a href="/viral-psg/">Viral</a>
        <a href="/videos-psg/">Vidéos</a>
        <a href="/calendrier-psg/">Calendrier</a>
        <a href="/joueurs-psg/">Joueurs</a>
        <a href="/records-psg/">Records</a>
        <a href="/histoire-psg/" aria-current="page">Histoire</a>
        <a href="/sources-psg/">Sources</a>
      </nav>
    </header>
    <main>
      <nav class="breadcrumb" aria-label="Fil d'Ariane"><a href="/">Accueil</a><span>/</span><a href="/histoire-psg/">Histoire PSG</a><span>/</span><span>Anciens joueurs PSG</span></nav>
      <section class="content-section all-time-index-page">
        <div class="section-heading">
          <div>
            <span class="section-kicker">Mémoire PSG</span>
            <h1>Anciens joueurs PSG : la liste complète A-Z</h1>
          </div>
          <span class="freshness">${escapeHTML(players.length)} entrées</span>
        </div>
        <p>
          La base Parisien 90 combine les fiches longues éditoriales et une extraction ouverte Wikidata sous licence CC0.
          Elle couvre les recherches Messi PSG, Neymar PSG, Mbappé PSG, Ronaldinho PSG, Zlatan PSG, Beckham PSG et les noms moins visibles qui font l'épaisseur historique du club.
          Pour les chiffres d'histoire, consultez aussi la page <a href="/records-psg/">records PSG</a>.
        </p>
        <div class="metric-strip all-time-metrics">
          <article><strong>${escapeHTML(players.length)}</strong><span>joueurs indexés</span></article>
          <article><strong>${escapeHTML(profiledCount)}</strong><span>fiches longues liées</span></article>
          <article><strong>${escapeHTML(getCountryCount("Brésil"))}</strong><span>Brésiliens repérés</span></article>
          <article><strong>${escapeHTML(getCountryCount("Argentine"))}</strong><span>Argentins repérés</span></article>
          <article><strong>${escapeHTML(getCountryCount("France"))}</strong><span>Français repérés</span></article>
          <article><strong>CC0</strong><span>base ouverte Wikidata</span></article>
        </div>
        <div class="interactive-toolbar all-time-toolbar">
          <label class="control-field">Recherche
            <input type="search" placeholder="Messi, Neymar, Mbappé, Rai..." data-all-time-search />
          </label>
          <label class="control-field">Poste
            <select data-all-time-position>
              ${positions.map((position) => `<option value="${escapeHTML(position)}">${escapeHTML(position)}</option>`).join("")}
            </select>
          </label>
          <label class="control-field">Pays
            <select data-all-time-country>
              ${countryOptions.map((country) => `<option value="${escapeHTML(country.value || countryKey(country.label))}">${escapeHTML(country.label)}${country.count ? ` (${escapeHTML(country.count)})` : ""}</option>`).join("")}
            </select>
          </label>
          <label class="control-field">Fiches
            <select data-all-time-profile>
              <option value="all">Tous</option>
              <option value="yes">Avec fiche longue</option>
              <option value="no">À enrichir</option>
            </select>
          </label>
          <span class="freshness" data-all-time-count>${escapeHTML(players.length)} joueurs affichés</span>
        </div>
        <div class="table-scroll all-time-table-wrap">
          <table class="all-time-table" data-all-time-table>
            <caption>Index Parisien 90 des joueurs passés par le PSG</caption>
            <thead>
              <tr>
                <th>Joueur</th>
                <th>Période PSG</th>
                <th>Poste</th>
                <th>Pays</th>
                <th>Source / fiche</th>
              </tr>
            </thead>
            <tbody>
${rows}
            </tbody>
          </table>
        </div>
        <p class="source-note">
          Source ouverte : <a href="${escapeHTML(allTimePsgPlayersMeta.sourceUrl)}" rel="noopener noreferrer">${escapeHTML(allTimePsgPlayersMeta.sourceName)}</a>, licence ${escapeHTML(allTimePsgPlayersMeta.sourceLicense)}.
          Les compteurs par pays sont calculés depuis les nationalités publiques de la base ; un joueur à double nationalité peut donc apparaître dans plusieurs filtres.
          Les périodes et statuts sont consolidés progressivement avec PSG.fr, HistoireduPSG et les archives publiques ; les fiches longues sont des synthèses originales Parisien 90.
        </p>
      </section>
    </main>
    <footer class="site-footer">
      <p>Parisien 90 est un média indépendant consacré au PSG. Aucun lien officiel avec le Paris Saint-Germain.</p>
      <nav>
        <a href="/mentions-legales/">Mentions légales</a>
        <a href="/confidentialite/">Confidentialité</a>
        <a href="/cookies/">Cookies</a>
        <a href="/contact-retrait/">Contact / retrait</a>
        <a href="/droits-disclaimer/">Droits & disclaimer</a>
      </nav>
    </footer>
    <script type="module" src="/src/site.js"></script>
  </body>
</html>
`;
};

const brDateLabel = (label) =>
  String(label || "")
    .replace("janvier", "janeiro")
    .replace("février", "fevereiro")
    .replace("mars", "março")
    .replace("avril", "abril")
    .replace("mai", "maio")
    .replace("juin", "junho")
    .replace("juillet", "julho")
    .replace("août", "agosto")
    .replace("septembre", "setembro")
    .replace("octobre", "outubro")
    .replace("novembre", "novembro")
    .replace("décembre", "dezembro")
    .replace(/^(\d{1,2}) ([a-zç]+) (\d{4})$/i, "$1 de $2 de $3");

const brStatusLabel = (value) =>
  String(value || "")
    .replace("Terminé", "Encerrado")
    .replace("Programmé", "Marcado")
    .replace("Horaire à confirmer", "Horário a confirmar")
    .replace("Tirage à venir", "Sorteio a definir")
    .replace("Si qualification", "Se o PSG se classificar")
    .replace("À confirmer", "A confirmar");

const brCompetitionLabel = (value) =>
  String(value || "")
    .replace("Groupe", "Grupo")
    .replace("Match", "Jogo")
    .replace("Europe", "Europa")
    .replace("Calendrier", "Calendário")
    .replace("Effectif", "Elenco")
    .replace("Staff", "Comissão")
    .replace("Joueur", "Jogador")
    .replace("Ancien", "Ídolo")
    .replace("Mercato", "Mercado")
    .replace("Amical", "Amistoso")
    .replace("Ligue des champions", "Liga dos Campeões")
    .replace("Supercoupe de l'UEFA", "Supercopa da UEFA")
    .replace("Trophée des Champions", "Troféu dos Campeões")
    .replace("Coupe de France", "Copa da França");

const brPlaceLabel = (value) =>
  String(value || "")
    .replace("Domicile", "Casa")
    .replace("Extérieur", "Fora")
    .replace("Neutre", "Neutro")
    .replace("À confirmer", "A confirmar");

const brReliabilityLabel = (value) =>
  String(value || "")
    .replace("Officiel", "Oficial")
    .replace("officiel", "oficial")
    .replace("conférence", "coletiva")
    .replace("Conférence", "Coletiva")
    .replace("Rumeur solide", "Rumor consistente")
    .replace("rumeur solide", "rumor consistente")
    .replace("à confirmer", "a confirmar")
    .replace("attendue", "esperada")
    .replace("attendu", "esperado");

const brStoryTranslations = [
  {
    id: "psg-monaco-defaite-marquinhos-nazinho-idumbo-septembre-2026",
    title: "PSG-Monaco: Paris cai no Parc e acende o primeiro alerta",
    summary: "O PSG abriu o placar com Marquinhos, mas levou a virada do Monaco. Para o torcedor brasileiro, é o tipo de derrota que coloca lupa na defesa, na rotação e no apetite do time."
  },
  {
    id: "psg-monaco-groupe-dembele-neves-digne-septembre-2026",
    title: "Dembélé e João Neves voltam, Lucas Digne fica fora do grupo",
    summary: "Luis Enrique ganha dois retornos fortes, mas a ausência de Digne muda a leitura do corredor esquerdo. É notícia de grupo, mas com cheiro de recado esportivo."
  },
  {
    id: "psg-ligue-champions-calendrier-phase-ligue-uefa-2026",
    title: "Liga dos Campeões: o caminho do PSG está definido, e promete faísca",
    summary: "O calendário europeu coloca Paris diante de noites grandes logo cedo. Barcelona, City e Roma dão ao PSG uma temporada com cara de prova mundial."
  },
  {
    id: "luis-enrique-mercato-exceptionnel-psg-monaco-2026",
    title: "Luis Enrique fecha o mercado: Paris assume um verão de força",
    summary: "O treinador coloca ponto final no mercado e assume a ambição do elenco. A pergunta que fica: o PSG comprou equilíbrio ou criou uma briga por minutos?"
  }
];

const getBrLatestStories = () =>
  brStoryTranslations
    .map((story) => ({ ...story, item: publishedNewsFeed.find((item) => item.id === story.id) }))
    .filter((story) => story.item);

const brProfileCopy = {
  marquinhos: "Capitão, recordista e elo vivo entre várias eras do Paris Saint-Germain.",
  "lucas-beraldo": "Zagueiro brasileiro canhoto, sereno na saída e ainda com margem real de crescimento.",
  "ousmane-dembele": "A peça de caos controlado do ataque: aceleração, ambidestria e talento para virar jogos.",
  vitinha: "O meio-campista que dá ritmo, limpa a pressão e organiza o PSG por dentro.",
  "joao-neves": "Pressão, volume e coragem com a bola: perfil perfeito para a intensidade de Luis Enrique.",
  "desire-doue": "Criatividade jovem, condução curta e potencial para ganhar noites grandes.",
  "khvicha-kvaratskhelia": "Drible, improviso e agressividade pelo lado esquerdo.",
  "warren-zaire-emery": "O rosto formado em casa dentro de um projeto global."
};

const brLegendCopy = {
  rai: "O capitão eterno da Recopa europeia de 1996 e um dos maiores pontes afetivas entre Paris e Brasil.",
  ronaldinho: "Dois anos de magia antes do estouro mundial: o PSG teve Ronaldinho quando o planeta ainda descobria o gênio.",
  neymar: "O jogador que mudou a escala midiática do clube, entre brilho absoluto, lesões e debate permanente.",
  marquinhos: "Brasileiro de longa duração, capitão, símbolo de fidelidade e recordista do clube.",
  "thiago-silva": "O Monstro deu autoridade europeia ao PSG moderno e marcou uma geração de torcedores.",
  "lucas-moura": "Arrancadas, promessa gigante e memória viva da primeira fase QSI.",
  leonardo: "Elegância como jogador e papel enorme nos bastidores do PSG moderno.",
  nene: "Canhota, gols e personalidade: um dos símbolos técnicos da virada pré-QSI/QSI.",
  maxwell: "Sobriedade, inteligência e títulos: o luxo tranquilo da lateral esquerda.",
  alex: "Força, bola parada e segurança no primeiro PSG da era QSI.",
  "dani-alves": "Vencedor nato, experiência de vestiário grande e conexão direta com a era Neymar.",
  "david-luiz": "Carisma, risco e personalidade gigante em uma defesa que nunca passou despercebida.",
  valdo: "Antes e ao lado de Raí, deu ao PSG uma assinatura brasileira refinada."
};

const brCurrentProfileIds = new Set([
  "marquinhos",
  "lucas-beraldo",
  "ousmane-dembele",
  "vitinha",
  "joao-neves",
  "desire-doue",
  "khvicha-kvaratskhelia",
  "warren-zaire-emery"
]);
const brLegendProfileIds = new Set([
  "rai",
  "ronaldinho",
  "neymar",
  "marquinhos",
  "thiago-silva",
  "lucas-moura",
  "leonardo",
  "nene",
  "maxwell",
  "alex",
  "dani-alves",
  "david-luiz",
  "valdo",
  "lionel-messi",
  "kylian-mbappe"
]);

const brProfileDetails = {
  marquinhos: {
    kicker: "Capitão",
    intro: "Marquinhos é mais do que um zagueiro do PSG: é a linha contínua entre o clube das grandes estrelas, o projeto vencedor e a obrigação de estabilidade.",
    paragraphs: [
      "Chegou jovem, atravessou ciclos, viu treinadores, astros e pressões mudarem, mas permaneceu como referência. Para o público brasileiro, sua história é especial porque mistura regularidade europeia, liderança silenciosa e uma identificação rara com Paris.",
      "No campo, Marquinhos vale pela leitura defensiva, pela capacidade de cobrir espaços grandes e pela autoridade em jogos de tensão. Fora dele, pesa como símbolo: quando o PSG busca maturidade, o capitão vira termômetro.",
      "A questão para a temporada é física e emocional. Paris precisa de Marquinhos forte nos grandes jogos, mas também bem gerido em uma defesa que se renova."
    ],
    focusTitle: "Por que Marquinhos é uma página central do PSG no Brasil?",
    focus: "Porque ele junta tudo que interessa ao torcedor brasileiro: longevidade, braçadeira, títulos, ligação afetiva e uma presença ainda ativa no elenco.",
    faq: [
      ["Marquinhos ainda joga no PSG?", "Sim. Na base de dados Parisien 90, Marquinhos aparece como capitão e jogador do elenco 2026-2027."],
      ["Qual é o papel de Marquinhos no PSG?", "Ele é tratado como zagueiro central, líder de vestiário e referência histórica do grupo."],
      ["Por que Marquinhos importa para os brasileiros do PSG?", "Porque é um dos brasileiros mais duradouros e identificados com Paris, ao lado de nomes como Raí, Ronaldinho, Neymar e Thiago Silva."]
    ]
  },
  neymar: {
    kicker: "Ícone global",
    intro: "Neymar no PSG é uma história impossível de reduzir: houve gênio, lesão, fascínio mundial, irritação, recorde simbólico e debate permanente.",
    paragraphs: [
      "A chegada de Neymar mudou a escala do Paris Saint-Germain. O clube deixou de ser apenas candidato europeu rico para virar tema planetário diário, especialmente no Brasil.",
      "Sua passagem por Paris foi feita de noites de brilho absoluto e de frustrações profundas. Para alguns, faltou a sequência física nos momentos decisivos. Para outros, o talento foi tão alto que a cobrança virou quase impossível de satisfazer.",
      "Neymar continua sendo uma das portas de entrada mais fortes para o público brasileiro entender o PSG moderno: ambição, espetáculo, marketing, pressão e a fronteira delicada entre estrela e projeto coletivo."
    ],
    focusTitle: "Neymar PSG: brilho ou ferida aberta?",
    focus: "A pergunta ainda divide torcedores porque Neymar deu visibilidade mundial ao PSG, mas também deixou a sensação de que Paris nunca viu a versão inteira do seu melhor futebol por tempo suficiente.",
    faq: [
      ["Quando Neymar jogou no PSG?", "Neymar jogou pelo Paris Saint-Germain entre 2017 e 2023."],
      ["Por que Neymar é tão importante na história do PSG?", "Porque sua contratação mudou o patamar midiático do clube e aproximou ainda mais o PSG do público brasileiro."],
      ["A página usa informações privadas?", "Não. A ficha limita-se ao interesse esportivo, histórico e público."]
    ]
  },
  ronaldinho: {
    kicker: "Fantasia pura",
    intro: "Ronaldinho Gaúcho no PSG é o capítulo perfeito para quem ama futebol antes da planilha: Paris teve o gênio quando o planeta ainda descobria o tamanho dele.",
    paragraphs: [
      "Entre 2001 e 2003, Ronaldinho ofereceu ao Parc des Princes uma amostra do jogador que depois encantaria o mundo. Dribles, improviso, sorriso, pausa e explosão: tudo já estava ali.",
      "O PSG não teve Ronaldinho por muito tempo, mas teve Ronaldinho em estado de descoberta. Isso dá ao clube uma história rara: Paris foi palco de formação pública de uma lenda global.",
      "Para o leitor brasileiro, é uma ficha emocional. Ronaldinho não é apenas um antigo jogador do PSG; é a prova de que o clube já falava a língua do futebol arte antes de se tornar potência mundial."
    ],
    focusTitle: "Ronaldinho PSG: por que esse período fascina tanto?",
    focus: "Porque une nostalgia, Brasil, futebol espetáculo e a sensação de ter visto uma obra-prima antes do reconhecimento universal.",
    faq: [
      ["Quando Ronaldinho jogou no PSG?", "Ronaldinho Gaúcho jogou no Paris Saint-Germain entre 2001 e 2003."],
      ["Existe foto utilizável de Ronaldinho?", "Esta ficha usa somente imagem com licença aberta já creditada, quando disponível no banco do site."],
      ["Ronaldinho virou estrela mundial depois do PSG?", "Sim. Seu período parisiense antecede a consagração global que viria depois, especialmente no futebol espanhol e na seleção brasileira."]
    ]
  },
  rai: {
    kicker: "Capitão eterno",
    intro: "Raí é a ponte afetiva mais nobre entre o Paris Saint-Germain e o Brasil: liderança, elegância e título europeu no mesmo personagem.",
    paragraphs: [
      "Nos anos 90, Raí ajudou o PSG a ganhar densidade internacional. Não era apenas um craque brasileiro em Paris; era um capitão com presença, técnica e autoridade.",
      "A Recopa europeia de 1996 colocou seu nome no centro da memória parisiense. Para muitos torcedores, Raí representa uma era em que o PSG se descobria grande sem perder certo romantismo.",
      "No Brasil, sua imagem pública também carrega causas sociais e educativas, o que reforça uma dimensão que ultrapassa o campo sem transformar a ficha em vida privada."
    ],
    focusTitle: "Raí PSG: o brasileiro que virou memória institucional",
    focus: "Raí é decisivo porque oferece ao PSG uma ligação brasileira baseada em liderança e conquista, não apenas em brilho individual.",
    faq: [
      ["Quando Raí jogou no PSG?", "Raí atuou pelo Paris Saint-Germain entre 1993 e 1998."],
      ["Qual título europeu marca Raí no PSG?", "Ele é associado à campanha da Recopa europeia conquistada pelo PSG em 1996."],
      ["Por que Raí é amado em Paris?", "Pela combinação de técnica, liderança e papel simbólico em uma era fundadora da ambição europeia do clube."]
    ]
  },
  "thiago-silva": {
    kicker: "O Monstro",
    intro: "Thiago Silva deu ao PSG moderno uma coisa que dinheiro sozinho não compra: autoridade defensiva reconhecida por todos.",
    paragraphs: [
      "Na primeira grande coluna vertebral do projeto QSI, Thiago Silva foi a peça que estabilizou a defesa e elevou a percepção europeia do clube.",
      "Capitão, zagueiro elegante e líder técnico, ele representou uma forma brasileira menos carnavalesca e mais cirúrgica: leitura, timing, antecipação e comando.",
      "Sua saída marcou também uma discussão recorrente em Paris: até que ponto o clube sabe encerrar ciclos sem perder experiência nos grandes jogos?"
    ],
    focusTitle: "Thiago Silva PSG: liderança que ainda pesa",
    focus: "Seu nome continua forte porque ajuda a comparar as defesas atuais do PSG com a primeira grande era de ambição europeia do clube.",
    faq: [
      ["Quando Thiago Silva jogou no PSG?", "Thiago Silva jogou no Paris Saint-Germain entre 2012 e 2020."],
      ["Qual era o papel de Thiago Silva no PSG?", "Era zagueiro central, capitão e referência defensiva do projeto moderno."],
      ["Por que era chamado de O Monstro?", "O apelido se ligou à sua autoridade defensiva, regularidade e leitura de jogo."]
    ]
  },
  "lionel-messi": {
    kicker: "Ícone absoluto",
    intro: "Lionel Messi no PSG foi curto, discutido e planetário: duas temporadas suficientes para mudar a visibilidade do clube em todos os continentes.",
    paragraphs: [
      "A passagem de Messi por Paris não se resume ao rendimento em campo. Ela colocou o PSG no centro de uma conversa global diária, com torcedores que talvez nunca acompanhassem a Ligue 1.",
      "A leitura esportiva segue dividida. Houve talento, gols, passes e estatuto lendário, mas também a sensação de encaixe incompleto com aquilo que Paris esperava nas noites europeias.",
      "Mesmo assim, poucos nomes carregam tanto peso histórico. Ter Messi na lista de antigos jogadores transforma o PSG em capítulo obrigatório da biografia do maior imaginário futebolístico moderno."
    ],
    focusTitle: "Messi PSG: passagem curta, impacto enorme",
    focus: "O interesse segue alto porque une o maior nome de sua geração a uma experiência parisiense intensa, discutida e global.",
    faq: [
      ["Quando Messi jogou no PSG?", "Lionel Messi jogou pelo Paris Saint-Germain entre 2021 e 2023."],
      ["A passagem de Messi pelo PSG foi consensual?", "Não. Ela segue debatida entre impacto estatístico, visibilidade global e expectativas europeias."],
      ["Por que manter uma ficha Messi PSG?", "Porque sua passagem é uma referência mundial para entender a era das superestrelas do clube."]
    ]
  },
  "kylian-mbappe": {
    kicker: "Recordista",
    intro: "Kylian Mbappé é um caso central na história do PSG: maior goleador, superstar francesa, rosto do projeto e capítulo de ruptura.",
    paragraphs: [
      "No PSG, Mbappé virou máquina de gols e rosto mundial do projeto. A velocidade, a finalização e a obsessão pelos grandes jogos redefiniram o teto individual parisiense.",
      "Sua história com Paris continua poderosa porque mistura identificação francesa, ambição europeia, recordes e uma separação muito comentada.",
      "Para o público brasileiro, Mbappé interessa também como rival narrativo de Neymar, parceiro de Messi e símbolo de um PSG que tentou reunir individualidades gigantes do futebol moderno."
    ],
    focusTitle: "Mbappé PSG: recordes, poder e ruptura",
    focus: "Sua ficha segue indispensável porque nenhum atacante marcou tão fortemente o PSG moderno em números, exposição e debate.",
    faq: [
      ["Quando Mbappé jogou no PSG?", "Kylian Mbappé jogou no Paris Saint-Germain entre 2017 e 2024."],
      ["Qual é a marca mais forte de Mbappé no PSG?", "Ele é apresentado na base Parisien 90 como o maior goleador histórico do clube."],
      ["Por que Mbappé interessa ao público brasileiro?", "Porque sua história cruza Neymar, Messi, Champions League, França e a construção global do PSG."]
    ]
  }
};

const brValueTranslations = [
  ["Vivant", "Vivo"],
  ["Période à vérifier", "Período a verificar"],
  ["Poste à vérifier", "Posição a verificar"],
  ["Effectif provisoire PSG 2026-2027", "Elenco provisório PSG 2026-2027"],
  ["Gardien de but", "Goleiro"],
  ["Gardiens", "Goleiros"],
  ["Défenseurs", "Defensores"],
  ["Milieux", "Meio-campistas"],
  ["Attaquants", "Atacantes"],
  ["Capitaine et recordman", "Capitão e recordista"],
  ["Cadre majeur", "Titular importante"],
  ["Cadre polyvalent", "Referência versátil"],
  ["Titulaire majeur", "Titular importante"],
  ["Prolongé jusqu'en 2031", "Contrato renovado até 2031"],
  ["Prolongé jusqu'en 2028 (+1 an en option)", "Contrato renovado até 2028 (+1 ano opcional)"],
  ["Talent premium", "Talento de elite"],
  ["Symbole du projet", "Símbolo do projeto"],
  ["Cerveau du jeu", "Cérebro do jogo"],
  ["Menace offensive majeure", "Ameaça ofensiva importante"],
  ["Star du cycle Luis Enrique", "Estrela do ciclo Luis Enrique"],
  ["Jeune offensif", "Jovem atacante"],
  ["Milieu de terrain", "Meio-campista"],
  ["Défenseur central, leader de vestiaire", "Zagueiro, líder do vestiário"],
  ["Défenseur central gaucher", "Zagueiro canhoto"],
  ["Défenseur central ou latéral gauche", "Zagueiro ou lateral esquerdo"],
  ["Défenseur central", "Zagueiro"],
  ["Défenseur", "Defensor"],
  ["Latéral droit offensif", "Lateral direito ofensivo"],
  ["Latéral gauche explosif", "Lateral esquerdo explosivo"],
  ["Attaquant créateur", "Atacante criativo"],
  ["Ailier ou milieu offensif", "Ponta ou meia-atacante"],
  ["Ailier gauche", "Ponta esquerda"],
  ["Attaquant", "Atacante"],
  ["Meneur offensif", "Meia-atacante"],
  ["Milieu organisateur", "Meio-campista organizador"],
  ["Milieu box-to-box", "Meio-campista box-to-box"],
  ["Milieu intense et organisateur", "Meio-campista intenso e organizador"],
  ["Meneur de jeu", "Meia armador"],
  ["Gardien", "Goleiro"],
  ["Milieu", "Meio-campista"],
  ["Minutes gagnées face à la concurrence centrale.", "Minutos conquistados diante da concorrência na zaga."],
  ["Gestion physique et rôle dans une défense rajeunie.", "Gestão física e papel em uma defesa rejuvenescida."],
  ["Influence dans les matchs verrouillés.", "Influência em jogos fechados."],
  ["Gestion de la fatigue sur une saison longue.", "Gestão do desgaste em uma temporada longa."],
  ["Leadership et régularité offensive.", "Liderança e regularidade ofensiva."],
  ["Relation avec Nuno Mendes et efficacité dans les zones décisives.", "Relação com Nuno Mendes e eficiência nas zonas decisivas."],
  ["Leadership offensif et constance devant le but.", "Liderança ofensiva e constância diante do gol."],
  ["Choix dans le dernier geste et gestion de l'exposition médiatique.", "Escolhas no último gesto e gestão da exposição midiática."],
  ["Repère historique du groupe, symbole de continuité entre plusieurs cycles parisiens.", "Referência histórica do grupo e símbolo de continuidade entre vários ciclos de Paris."],
  ["Relance propre, calme sous pression et marge de progression encore réelle.", "Saída limpa, calma sob pressão e margem real de crescimento."],
  ["Ambidextrie, vitesse et chaos contrôlé : il peut retourner un match en deux accélérations.", "Ambidestria, velocidade e caos controlado: pode virar um jogo em duas acelerações."],
  ["Le joueur qui règle le tempo, résiste au pressing et accélère quand Paris veut étouffer.", "O jogador que dita o ritmo, resiste à pressão e acelera quando Paris quer sufocar o rival."],
  ["Pressing, qualité sous pression et volume : le type de joueur qui fait respirer tout un bloc.", "Pressão, qualidade sob marcação e volume: o tipo de jogador que faz todo o bloco respirar."],
  ["Créativité, conduite de balle et polyvalence dans les demi-espaces.", "Criatividade, condução de bola e versatilidade nos meios-espaços."],
  ["Dribble, imprévisibilité et prise de risque permanente.", "Drible, imprevisibilidade e tomada de risco permanente."],
  ["Puissance, maturité et identité parisienne : il incarne la passerelle entre formation et très haut niveau.", "Potência, maturidade e identidade parisiense: ele representa a ponte entre formação e alto nível."],
  ["Joueur majeur du PSG actuel.", "Jogador importante do PSG atual."],
  ["Joueur encore actif et immense personnalité médiatique du football mondial.", "Personalidade pública enorme do futebol mundial."],
  ["Joueur encore actif, icône absolue du football mondial.", "Ícone absoluto do futebol mundial."],
  ["Star internationale encore en activité, après son départ du PSG.", "Estrela internacional depois de sua saída do PSG."],
  ["Figure publique au Brésil, engagé dans des causes sociales et éducatives.", "Figura pública no Brasil, ligada a causas sociais e educativas."],
  ["Ambassadeur médiatique du football spectacle, présent sur des événements internationaux.", "Embaixador midiático do futebol espetáculo, presente em eventos internacionais."],
  ["Grand défenseur brésilien, figure de leadership reconnue en Europe et au Brésil.", "Grande zagueiro brasileiro, referência de liderança na Europa e no Brasil."],
  ["15 juillet 2026", "15 de julho de 2026"],
  ["29 août 2026", "29 de agosto de 2026"],
  ["4 septembre 2026", "4 de setembro de 2026"],
  ["5 septembre 2026", "5 de setembro de 2026"]
];

const brValue = (value) => {
  let next = String(value || "");
  brValueTranslations.forEach(([from, to]) => {
    next = next.replaceAll(from, to);
  });
  return next;
};

const brImageAlt = (profile) =>
  brValue(profile.image?.alt || profile.name)
    .replaceAll("avec la sélection brésilienne en", "com a seleção brasileira em")
    .replaceAll("sous les couleurs du PSG", "com a camisa do PSG")
    .replaceAll("lors d'un événement football", "em um evento de futebol");

const brProfileCardPath = (profile) => {
  if (brCurrentProfileIds.has(profile.id)) return brCurrentPlayerPath(profile);
  if (brLegendProfileIds.has(profile.id)) return brLegendProfilePath(profile);
  return legendPath(profile);
};

const brCurrentCardPath = (profile) =>
  brCurrentProfileIds.has(profile.id) ? brCurrentPlayerPath(profile) : currentPlayerPath(profile);

const makeBrHeader = (active) => {
  const links = [
    ["/br/", "Início", "home"],
    ["/br/noticias-psg/", "Notícias", "noticias"],
    ["/br/transferencias-psg/", "Transferências", "transferencias"],
    ["/br/mercado-psg/", "Mercado", "mercado"],
    ["/br/dossies-psg/", "Dossiês", "dossies"],
    ["/br/jogadores-psg/", "Jogadores", "jogadores"],
    ["/br/historia-psg/", "História", "historia"],
    ["/br/antigos-jogadores-psg/", "Ídolos", "idolos"],
    ["/br/brasileiros-no-psg/", "Brasileiros", "brasileiros"],
    ["/", "FR", "fr"]
  ];

  return `<header class="site-header">
      <a class="brand" href="/br/" aria-label="Parisien 90 Brasil">
        <span class="brand-mark">P90</span>
        <span><strong>Parisien 90</strong><small>Redação PSG Brasil</small></span>
      </a>
      <nav class="main-nav" aria-label="Navegação principal">
        ${links.map(([href, label, key]) => `<a href="${href}"${key === "fr" ? ' class="language-switch" data-language-switch="true" hreflang="fr-FR"' : ""}${active === key ? ' aria-current="page"' : ""}>${label}</a>`).join("\n        ")}
      </nav>
    </header>`;
};

const makeBrPage = ({ path, title, description, active, frPath, body, jsonLd }) => {
  const url = `${siteUrl}${path}`;
  const frUrl = `${siteUrl}${frPath || "/"}`;

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHTML(title)}</title>
    <meta name="description" content="${escapeHTML(description)}" />
    <link rel="canonical" href="${escapeHTML(url)}" />
    <link rel="alternate" hreflang="pt-BR" href="${escapeHTML(url)}" />
    <link rel="alternate" hreflang="fr-FR" href="${escapeHTML(frUrl)}" />
    <link rel="alternate" hreflang="x-default" href="${escapeHTML(frUrl)}" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="apple-touch-icon" href="/icons/parisien-90-app-icon.svg" />
    <meta name="theme-color" content="#071426" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHTML(title)}" />
    <meta property="og:description" content="${escapeHTML(description)}" />
    <meta property="og:url" content="${escapeHTML(url)}" />
    <meta property="og:image" content="${escapeHTML(heroImage)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <script type="application/ld+json">${safeJson(jsonLd)}</script>
    <link rel="stylesheet" href="/src/styles.css" />
  </head>
  <body>
    ${makeBrHeader(active)}
    <main>
      ${body}
    </main>
    <footer class="site-footer">
      <p>Parisien 90 Brasil - mídia independente sobre o Paris Saint-Germain. Nenhuma afiliação oficial ao clube.</p>
      <a href="/br/">Brasil</a>
      <a href="/br/brasileiros-no-psg/">Brasileiros no PSG</a>
      <a href="/droits-disclaimer/">Direitos e aviso legal</a>
      <a href="/contact-retrait/">Contato / remoção</a>
    </footer>
    <script type="module" src="/src/site.js"></script>
  </body>
</html>`;
};

const getBrArticleAngle = (item) => {
  const category = normalizeKey(item.category);
  const title = normalizeKey(item.title);

  if (category.includes("mercato") || title.includes("transfert")) {
    return {
      label: "Mercado PSG",
      pillar: "/br/mercado-psg/",
      stakes: "No mercado do PSG, o nome não basta. O leitor precisa saber quem informa, o que está assinado, o que ainda depende de clube, agente ou exame médico, e como a notícia mexe no elenco.",
      watch: "O próximo sinal forte costuma ser comunicado oficial, acordo entre clubes, viagem, exame médico ou fala atribuída. Antes disso, a leitura fica viva, mas prudente."
    };
  }

  if (category.includes("calendrier") || category.includes("match") || category.includes("europe")) {
    return {
      label: "Calendário PSG",
      pillar: "/br/transferencias-psg/",
      stakes: "Um jogo do PSG importa pelo resultado, mas também pelo estado físico do grupo, pela rotação de Luis Enrique e pela forma como Paris administra pressão em uma temporada longa.",
      watch: "Datas, horários, locais e competições podem mudar. Por isso, Parisien 90 Brasil trata calendário como informação viva, sempre ligada à fonte oficial quando ela existe."
    };
  }

  if (category.includes("effectif") || category.includes("staff") || category.includes("groupe") || category.includes("joueur")) {
    return {
      label: "Elenco PSG",
      pillar: "/br/jogadores-psg/",
      stakes: "Uma notícia de grupo nunca é pequena em Paris. Ela pode revelar hierarquia, proteção física, disputa por minutos, retorno importante ou recado tático antes de um jogo grande.",
      watch: "O ponto a acompanhar é a sequência: presença no treino, convocação, minutos em campo, papel tático e reação de Luis Enrique depois do jogo."
    };
  }

  return {
    label: "Atualidade PSG",
    pillar: "/br/",
    stakes: "Uma notícia sobre o PSG circula rápido, mas só se torna útil quando vem com data, hora, fonte e contexto. O objetivo é separar sinal forte, rumor e leitura editorial.",
    watch: "A evolução deve ser acompanhada por fonte identificada, confirmação oficial ou novo fato verificável, sem transformar comentário em notícia."
  };
};

const makeBrNewsArticlePage = (story) => {
  const item = story.item;
  const path = brItemPath(item);
  const url = brItemUrl(item);
  const frPath = itemPath(item);
  const dateTime = itemDateTimeISO(item);
  const angle = getBrArticleAngle(item);
  const related = getBrLatestStories()
    .filter((candidate) => candidate.item.id !== item.id)
    .slice(0, 3);
  const title = `${story.title} | Parisien 90 Brasil`;
  const description = `${story.summary} Fonte: ${item.source}.`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "NewsArticle",
        "@id": `${url}#article`,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        headline: story.title,
        description: story.summary,
        image: [heroImage],
        datePublished: dateTime,
        dateModified: newsMeta.updatedAt,
        inLanguage: "pt-BR",
        articleSection: brCompetitionLabel(item.category),
        keywords: ["PSG", "Paris Saint-Germain", "notícias PSG", "mercado PSG", "transferências PSG", "jogadores PSG", "Brasil PSG"],
        isAccessibleForFree: true,
        author: { "@type": "Organization", name: "Parisien 90 Brasil", url: `${siteUrl}/br/` },
        publisher: { "@type": "NewsMediaOrganization", name: "Parisien 90", url: siteUrl },
        copyrightHolder: { "@type": "Organization", name: "Parisien 90" },
        isBasedOn: { "@type": "CreativeWork", name: item.source, url: sourceUrl(item) },
        about: { "@type": "SportsTeam", name: "Paris Saint-Germain" }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Início", item: `${siteUrl}/br/` },
          { "@type": "ListItem", position: 2, name: "Notícias PSG", item: `${siteUrl}/br/noticias-psg/` },
          { "@type": "ListItem", position: 3, name: story.title, item: url }
        ]
      }
    ]
  };
  const relatedCards = related
    .map(
      (candidate) => `<article class="news-card" data-share-title="${escapeHTML(candidate.title)}" data-share-url="${escapeHTML(brItemPath(candidate.item))}">
            <time class="news-date" datetime="${escapeHTML(itemDateTimeISO(candidate.item))}">${escapeHTML(brDateLabel(candidate.item.dateLabel || newsMeta.displayDate))} · ${escapeHTML(candidate.item.time)}</time>
            <div class="news-topline"><span>${escapeHTML(brCompetitionLabel(candidate.item.category))}</span><strong>${escapeHTML(brReliabilityLabel(candidate.item.reliability))}</strong></div>
            <h3><a href="${escapeHTML(brItemPath(candidate.item))}">${escapeHTML(candidate.title)}</a></h3>
            <p>${escapeHTML(candidate.summary)}</p>
            <a href="${escapeHTML(brItemPath(candidate.item))}">Ler a análise</a>
          </article>`
    )
    .join("\n");
  const body = `<nav class="breadcrumb" aria-label="Trilha de navegação"><a href="/br/">Início</a><span>/</span><a href="/br/noticias-psg/">Notícias PSG</a><span>/</span><span>${escapeHTML(brCompetitionLabel(item.category))}</span></nav>
      <article class="article-page" data-share-title="${escapeHTML(story.title)}" data-share-url="${escapeHTML(path)}">
        <div class="article-hero">
          <div class="item-tags"><span>${escapeHTML(brCompetitionLabel(item.category))}</span><span>${escapeHTML(brReliabilityLabel(item.reliability))}</span><span>Viral ${escapeHTML(item.viral)}</span></div>
          <time datetime="${escapeHTML(dateTime)}">${escapeHTML(brDateLabel(item.dateLabel || newsMeta.displayDate))} · ${escapeHTML(item.time)}</time>
          <h1>${escapeHTML(story.title)}</h1>
          <p>${escapeHTML(story.summary)}</p>
        </div>
        <div class="article-layout">
          <div class="article-body">
            <h2>O que está confirmado</h2>
            <p>${escapeHTML(story.summary)}</p>
            <p>O sinal foi publicado em ${escapeHTML(brDateLabel(item.dateLabel || newsMeta.displayDate))}, às ${escapeHTML(item.time)}, e classificado como <strong>${escapeHTML(brReliabilityLabel(item.reliability))}</strong>. A fonte citada é <strong>${escapeHTML(item.source)}</strong>.</p>
            <h2>Por que isso importa para o PSG</h2>
            <p>${escapeHTML(angle.stakes)}</p>
            <p>Para o torcedor brasileiro, a notícia ganha peso quando conversa com o campo: quem joga, quem perde espaço, qual setor fica exposto e qual história Paris está construindo nesta temporada.</p>
            <h2>Leitura Parisien 90 Brasil</h2>
            <p>A leitura é direta: transformar o fato em contexto, sem copiar o texto da fonte e sem vender hipótese como confirmação. Quando existe debate, ele aparece como debate; quando existe fato, ele vem datado e atribuído.</p>
            <p>${escapeHTML(angle.watch)}</p>
            <h2>Fonte, direitos e método</h2>
            <p>Este artigo é uma síntese original em português do Brasil. Ele não reproduz a publicação de origem: cita a fonte, resume o fato com redação própria e orienta o leitor para verificar o sinal inicial.</p>
            <div class="source-box"><span>Fonte citada</span><a href="${escapeHTML(sourceUrl(item))}" rel="noopener noreferrer">${escapeHTML(item.source)}</a></div>
          </div>
          <aside class="article-sidebar">
            <span class="section-kicker">Continuar no Brasil</span>
            <a href="${escapeHTML(angle.pillar)}">${escapeHTML(angle.label)}</a>
            <a href="/br/noticias-psg/">Todas as notícias em português</a>
            <a href="/br/mercado-psg/">Mercado PSG</a>
            <a href="/br/jogadores-psg/">Jogadores do PSG</a>
            <a href="/br/brasileiros-no-psg/">Brasileiros no PSG</a>
            <a href="/br/dossies-psg/">Dossiês PSG</a>
          </aside>
        </div>
      </article>
      ${relatedCards ? `<section class="content-section"><div class="section-heading"><div><span class="section-kicker">Também em português</span><h2>Outras notícias PSG</h2></div></div><div class="hot-grid">${relatedCards}</div></section>` : ""}`;

  return makeBrPage({ path, title, description, active: "noticias", frPath, body, jsonLd });
};

const makeBrNewsIndexPage = (stories) => {
  const path = "/br/noticias-psg/";
  const title = "Notícias PSG em português do Brasil | Parisien 90 Brasil";
  const description = "Notícias do PSG em português do Brasil: mercado, jogos, elenco, Liga dos Campeões, fontes citadas e leitura editorial.";
  const cards = stories
    .map(
      (story) => `<article class="news-card" data-share-title="${escapeHTML(story.title)}" data-share-url="${escapeHTML(brItemPath(story.item))}">
            <time class="news-date" datetime="${escapeHTML(itemDateTimeISO(story.item))}">${escapeHTML(brDateLabel(story.item.dateLabel || newsMeta.displayDate))} · ${escapeHTML(story.item.time)}</time>
            <div class="news-topline"><span>${escapeHTML(brCompetitionLabel(story.item.category))}</span><strong>${escapeHTML(brReliabilityLabel(story.item.reliability))}</strong></div>
            <h3><a href="${escapeHTML(brItemPath(story.item))}">${escapeHTML(story.title)}</a></h3>
            <p>${escapeHTML(story.summary)}</p>
            <a href="${escapeHTML(brItemPath(story.item))}">Ler a análise</a>
          </article>`
    )
    .join("\n");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Notícias PSG Brasil",
    url: `${siteUrl}${path}`,
    inLanguage: "pt-BR",
    about: { "@type": "SportsTeam", name: "Paris Saint-Germain" },
    publisher: { "@type": "NewsMediaOrganization", name: "Parisien 90", url: siteUrl }
  };
  const body = `<section class="page-hero"><span class="section-kicker">Notícias PSG</span><h1>Notícias do PSG em português do Brasil</h1><p>Os principais sinais sobre Paris, reescritos para o leitor brasileiro: fonte, data, hora, contexto e impacto no time.</p></section>
      <section class="content-section"><div class="section-heading"><div><span class="section-kicker">Atualidade</span><h2>Últimas notícias traduzidas</h2></div><span class="freshness">${escapeHTML(brDateLabel(newsMeta.displayDate))} · ${escapeHTML(newsMeta.displayTime)}</span></div><div class="hot-grid">${cards}</div></section>`;

  return { path, url: `${siteUrl}${path}`, type: "br-news-index", html: makeBrPage({ path, title, description, active: "noticias", frPath: "/actualite-psg/", body, jsonLd }) };
};

const makeBrNewsPages = () => {
  const stories = getBrLatestStories();
  return [
    makeBrNewsIndexPage(stories),
    ...stories.map((story) => ({
      path: brItemPath(story.item),
      url: brItemUrl(story.item),
      type: "br-news",
      html: makeBrNewsArticlePage(story)
    }))
  ];
};

const makeBrProfilePage = ({ profile, type }) => {
  const isCurrent = type === "player";
  const detail = brProfileDetails[profile.id] || {};
  const path = isCurrent ? brCurrentPlayerPath(profile) : brLegendProfilePath(profile);
  const url = `${siteUrl}${path}`;
  const frPath = isCurrent ? currentPlayerPath(profile) : legendPath(profile);
  const title = isCurrent
    ? `${profile.name} PSG: ficha, função e contexto | Parisien 90 Brasil`
    : `${profile.name} PSG: história, passagem e legado | Parisien 90 Brasil`;
  const description = isCurrent
    ? `${profile.name} no PSG em português: ficha do jogador, função, status, pontos de atenção e fontes públicas.`
    : `${profile.name} no PSG em português: período em Paris, papel, legado, situação pública e leitura editorial.`;
  const profileImage = profile.image ? assetUrl(profile.image.url) : heroImage;
  const tags = [
    detail.kicker,
    profile.number ? `Nº ${profile.number}` : null,
    brValue(profile.position || profile.role),
    brValue(profile.status || profile.lifeStatus),
    profile.psgPeriod
  ].filter(Boolean);
  const facts = [
    ["Nome", profile.name],
    ["Status", brValue(profile.status || profile.lifeStatus)],
    ["Posição", brValue(profile.position)],
    ["Função", brValue(profile.role)],
    ["Linha", brValue(profile.line)],
    ["Número", profile.number],
    ["Período no PSG", profile.psgPeriod],
    ["Situação pública", brValue(profile.currentLife)],
    ["Ponto de atenção", brValue(profile.watch)],
    ["Nomes associados", Array.isArray(profile.aliases) ? profile.aliases.join(", ") : profile.aliases],
    ["Foto", profile.image ? `${profile.image.credit} - ${profile.image.license}` : null],
    ["Última atualização", brValue(profile.updatedAt)],
    ["Fonte", profile.source || "Síntese editorial Parisien 90"]
  ].filter(([, value]) => value);
  const faq = (detail.faq || []).map(([question, answer]) => ({ question, answer }));
  const photoMarkup = profile.image
    ? `<figure class="profile-photo-card">
              <img src="${escapeHTML(profile.image.url)}" alt="${escapeHTML(brImageAlt(profile))}" loading="eager" decoding="async" />
              <figcaption>
                Foto: <a href="${escapeHTML(profile.image.sourceUrl)}" rel="noopener noreferrer">${escapeHTML(profile.image.credit)}</a>,
                <a href="${escapeHTML(profile.image.licenseUrl)}" rel="noopener noreferrer">${escapeHTML(profile.image.license)}</a>.
                Uso editorial com atribuição; nenhuma afiliação oficial sugerida.
              </figcaption>
            </figure>`
    : "";
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": `${url}#profile`,
        url,
        name: title,
        description,
        dateModified: newsMeta.updatedAt,
        inLanguage: "pt-BR",
        primaryImageOfPage: profile.image ? { "@type": "ImageObject", url: profileImage, creditText: profile.image.credit, license: profile.image.licenseUrl } : undefined,
        about: {
          "@type": "Person",
          name: profile.name,
          jobTitle: brValue(profile.role || profile.position),
          alternateName: profile.aliases,
          image: profile.image ? profileImage : undefined,
          memberOf: { "@type": "SportsTeam", name: "Paris Saint-Germain" }
        },
        publisher: { "@type": "NewsMediaOrganization", name: "Parisien 90", url: siteUrl }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Início", item: `${siteUrl}/br/` },
          { "@type": "ListItem", position: 2, name: isCurrent ? "Jogadores PSG" : "Ídolos PSG", item: `${siteUrl}${isCurrent ? "/br/jogadores-psg/" : "/br/antigos-jogadores-psg/"}` },
          { "@type": "ListItem", position: 3, name: profile.name, item: url }
        ]
      }
    ]
  };
  if (faq.length) {
    jsonLd["@graph"].push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      inLanguage: "pt-BR",
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer }
      }))
    });
  }
  const relatedLinks = isCurrent
    ? [
        ["/br/jogadores-psg/", "Elenco do PSG"],
        ["/br/brasileiros-no-psg/", "Brasileiros no PSG"],
        ["/br/mercado-psg/", "Mercado PSG"],
        ["/br/historia-psg/", "História do PSG"]
      ]
    : [
        ["/br/antigos-jogadores-psg/", "Antigos jogadores"],
        ["/br/brasileiros-no-psg/", "Brasileiros no PSG"],
        ["/br/historia-psg/", "História do PSG"],
        ["/br/transferencias-psg/", "Transferências PSG"]
      ];
  const profileIntro =
    detail.intro ||
    brProfileCopy[profile.id] ||
    brLegendCopy[profile.id] ||
    brValue(profile.profile || profile.whyMatters || description);
  const fallbackParagraphs = [
    profileIntro,
    `${profile.name} interessa ao leitor brasileiro porque ajuda a entender o PSG por dentro: função, status, memória do clube e impacto na temporada.`,
    `A ficha é mantida em português do Brasil com dados públicos, fonte citada e atualização editorial sem exposição de informação pessoal sensível.`
  ];
  const profileParagraphs = detail.paragraphs || fallbackParagraphs;
  const focusText =
    detail.focus ||
    brProfileCopy[profile.id] ||
    brLegendCopy[profile.id] ||
    "Este perfil ajuda a entender a relação entre Paris, grandes jogadores, mercado internacional e memória do clube.";

  const body = `<nav class="breadcrumb" aria-label="Trilha de navegação"><a href="/br/">Início</a><span>/</span><a href="${escapeHTML(isCurrent ? "/br/jogadores-psg/" : "/br/antigos-jogadores-psg/")}">${escapeHTML(isCurrent ? "Jogadores" : "Antigos jogadores")}</a><span>/</span><span>${escapeHTML(profile.name)}</span></nav>
      <article class="profile-page article-page" data-share-title="${escapeHTML(title)}" data-share-url="${escapeHTML(path)}">
        <div class="article-hero">
          <div class="item-tags">${tags.map((tag) => `<span>${escapeHTML(tag)}</span>`).join("")}</div>
          <time datetime="${escapeHTML(newsMeta.updatedAt)}">Atualizado em ${escapeHTML(brValue(profile.updatedAt || newsMeta.displayDate))}</time>
          <h1>${escapeHTML(profile.name)} no PSG</h1>
          <p>${escapeHTML(profileIntro)}</p>
        </div>
        <div class="article-layout">
          <div class="article-body">
            <h2>Ficha rápida</h2>
            <dl class="profile-facts is-page">
              ${facts.map(([label, value]) => `<div><dt>${escapeHTML(label)}</dt><dd>${escapeHTML(value)}</dd></div>`).join("")}
            </dl>
            <h2>Leitura Parisien 90 Brasil</h2>
            ${profileParagraphs.filter(Boolean).map((paragraph) => `<p>${escapeHTML(paragraph)}</p>`).join("\n            ")}
            <h2>${escapeHTML(detail.focusTitle || `Por que ${profile.name} conta na memória do PSG?`)}</h2>
            <p>${escapeHTML(focusText)}</p>
            ${faq.length ? `<h2>FAQ ${escapeHTML(profile.name)} PSG</h2>
            <div class="faq-list">
              ${faq.map((item, index) => `<details${index === 0 ? " open" : ""}>
                <summary>${escapeHTML(item.question)}</summary>
                <p>${escapeHTML(item.answer)}</p>
              </details>`).join("\n              ")}
            </div>` : ""}
            <h2>Fontes, imagem e prudência</h2>
            <p>Esta página usa dados públicos, arquivos esportivos e fontes citadas. Nenhuma informação pessoal sensível é publicada. As imagens só aparecem quando existe licença aberta ou autorização clara.</p>
          </div>
          <aside class="article-sidebar">
            ${photoMarkup}
            <span class="section-kicker">Continuar</span>
            ${relatedLinks.map(([href, label]) => `<a href="${escapeHTML(href)}">${escapeHTML(label)}</a>`).join("\n            ")}
            <a href="/contact-retrait/">Sugerir correção</a>
          </aside>
        </div>
      </article>`;

  return {
    path,
    url,
    type: isCurrent ? "br-player" : "br-legend",
    html: makeBrPage({ path, title, description, active: isCurrent ? "jogadores" : "idolos", frPath, body, jsonLd })
  };
};

const makeBrProfileIndexPage = (profilePages) => {
  const cards = profilePages
    .map(({ profile, page, type }) => {
      const detail = brProfileDetails[profile.id] || {};
      return `<a class="topic-card" href="${escapeHTML(page.path)}">
          <span>${escapeHTML(type === "player" ? "Atual" : profile.psgPeriod || "História")}</span>
          <h3>${escapeHTML(profile.name)}</h3>
          <p>${escapeHTML(detail.intro || brProfileCopy[profile.id] || brLegendCopy[profile.id] || brValue(profile.profile || profile.whyMatters))}</p>
        </a>`;
    })
    .join("\n");
  const path = "/br/antigos-jogadores-psg/";
  const title = "Ídolos do PSG: Neymar, Ronaldinho, Messi, Mbappé | Parisien 90 Brasil";
  const description = "Fichas em português do Brasil sobre grandes nomes do PSG: Neymar, Ronaldinho, Raí, Thiago Silva, Messi, Mbappé, Marquinhos e estrelas de Paris.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Ídolos e grandes jogadores do PSG",
    url: `${siteUrl}${path}`,
    inLanguage: "pt-BR",
    about: { "@type": "SportsTeam", name: "Paris Saint-Germain" },
    publisher: { "@type": "NewsMediaOrganization", name: "Parisien 90", url: siteUrl }
  };

  return {
    path,
    url: `${siteUrl}${path}`,
    type: "br-profile-index",
    html: makeBrPage({
      path,
      title,
      description,
      active: "idolos",
      frPath: "/anciens-joueurs-psg/",
      jsonLd,
      body: `<section class="page-hero"><span class="section-kicker">Ídolos PSG</span><h1>Ídolos do PSG: estrelas, memória e debate</h1><p>Neymar, Ronaldinho, Raí, Thiago Silva, Messi, Mbappé e Marquinhos: Parisien 90 Brasil reúne fichas úteis, contextualizadas e prudentes para entender o peso de cada nome em Paris.</p></section>
      <section class="content-section"><div class="section-heading"><div><span class="section-kicker">Fichas em português</span><h2>Perfis prioritários</h2></div><a class="primary-action compact-action" href="/br/brasileiros-no-psg/">Brasileiros no PSG</a></div><div class="topic-grid">${cards}</div></section>
      <section class="content-section"><h2>Como ler essas fichas</h2><p>As páginas misturam fatos públicos, período parisiense, situação conhecida, impacto esportivo e leitura editorial. Quando há foto, a licença e o crédito aparecem na própria página.</p></section>`
    })
  };
};

const makeBrazilProfilePages = () => {
  const currentTargets = [...brCurrentProfileIds]
    .map((id) => currentPlayerProfiles.find((profile) => profile.id === id))
    .filter(Boolean)
    .map((profile) => ({ profile, type: "player", page: makeBrProfilePage({ profile, type: "player" }) }));
  const legendTargets = [...brLegendProfileIds]
    .map((id) => legendProfiles.find((profile) => profile.id === id))
    .filter(Boolean)
    .map((profile) => ({ profile, type: "legend", page: makeBrProfilePage({ profile, type: "legend" }) }));
  const profileTargets = [...currentTargets, ...legendTargets];

  return [makeBrProfileIndexPage(profileTargets), ...profileTargets.map((item) => item.page)];
};

const makeBrazilPages = (allTimePlayerIndex) => {
  const brLatest = getBrLatestStories();
  const upcomingFixtures = psgSchedule2627
    .filter((fixture) => fixture.isoDate >= currentDate)
    .slice(0, 5);
  const playerIds = ["marquinhos", "lucas-beraldo", "ousmane-dembele", "vitinha", "joao-neves", "desire-doue", "khvicha-kvaratskhelia", "warren-zaire-emery"];
  const currentPlayers = playerIds
    .map((id) => currentPlayerProfiles.find((profile) => profile.id === id))
    .filter(Boolean);
  const brazilianLegendIds = ["rai", "ronaldinho", "neymar", "marquinhos", "thiago-silva", "lucas-moura", "leonardo", "nene", "maxwell", "alex", "dani-alves", "david-luiz", "valdo"];
  const brazilianLegends = brazilianLegendIds
    .map((id) => legendProfiles.find((profile) => profile.id === id))
    .filter(Boolean);
  const countryCounts = new Map();
  allTimePlayerIndex.forEach((player) => {
    splitCountries(player.countries).forEach((country) => {
      const key = countryKey(country);
      if (!key) return;
      countryCounts.set(key, (countryCounts.get(key) || 0) + 1);
    });
  });
  const brazilianCount = countryCounts.get(countryKey("Brésil")) || brazilianLegends.length;
  const argentinianCount = countryCounts.get(countryKey("Argentine")) || 0;

  const newsCards = brLatest
    .map(
      (story) => `<article class="news-card" data-share-title="${escapeHTML(story.title)}" data-share-url="${escapeHTML(story.item ? brItemPath(story.item) : "/br/noticias-psg/")}">
          <time class="news-date" datetime="${escapeHTML(itemDateTimeISO(story.item))}">${escapeHTML(brDateLabel(story.item.dateLabel || newsMeta.displayDate))} · ${escapeHTML(story.item.time)}</time>
          <div class="news-topline"><span>${escapeHTML(brCompetitionLabel(story.item.category))}</span><strong>${escapeHTML(brReliabilityLabel(story.item.reliability))}</strong></div>
          <h3><a href="${escapeHTML(brItemPath(story.item))}">${escapeHTML(story.title)}</a></h3>
          <p>${escapeHTML(story.summary)}</p>
          <a href="${escapeHTML(brItemPath(story.item))}">Ler a análise</a>
        </article>`
    )
    .join("\n");

  const fixtureCards = upcomingFixtures
    .map(
      (fixture) => `<article class="match-card">
          <div class="item-tags"><span>${escapeHTML(brCompetitionLabel(fixture.competition))}</span><span>${escapeHTML(brPlaceLabel(fixture.place))}</span></div>
          <time datetime="${escapeHTML(`${fixture.isoDate}T${fixture.time === "À confirmer" ? "00:00" : fixture.time}:00`)}">${escapeHTML(brDateLabel(fixture.dateLabel))} · ${escapeHTML(brStatusLabel(fixture.time))}</time>
          <h3>${escapeHTML(fixture.home)} x ${escapeHTML(fixture.away)}</h3>
          <p>${escapeHTML(fixture.venue)} - ${escapeHTML(brStatusLabel(fixture.status))}</p>
        </article>`
    )
    .join("\n");

  const playerCards = currentPlayers
    .map(
      (profile) => `<a class="topic-card" href="${escapeHTML(brCurrentCardPath(profile))}">
          <span>${escapeHTML(profile.number || profile.line || "PSG")}</span>
          <h3>${escapeHTML(profile.name)}</h3>
          <p>${escapeHTML(brProfileCopy[profile.id] || profile.profile)}</p>
        </a>`
    )
    .join("\n");

  const legendCards = brazilianLegends
    .map(
      (profile) => `<a class="topic-card" href="${escapeHTML(brProfileCardPath(profile))}">
          <span>${escapeHTML(profile.psgPeriod || "PSG")}</span>
          <h3>${escapeHTML(profile.name)}</h3>
          <p>${escapeHTML(brLegendCopy[profile.id] || profile.profile)}</p>
        </a>`
    )
    .join("\n");
  const legendPreviewCards = brazilianLegends
    .slice(0, 6)
    .map(
      (profile) => `<a class="topic-card" href="${escapeHTML(brProfileCardPath(profile))}">
          <span>${escapeHTML(profile.psgPeriod || "PSG")}</span>
          <h3>${escapeHTML(profile.name)}</h3>
          <p>${escapeHTML(brLegendCopy[profile.id] || profile.profile)}</p>
        </a>`
    )
    .join("\n");
  const brDossierPath = "/br/dossies-psg/brasileiros-psg-alma-mundial-paris/";
  const frBrazilDossierPath = "/dossiers-psg/bresiliens-psg-rai-ronaldinho-neymar-marquinhos/";
  const brDossierTitle = "Brasileiros no PSG: Raí, Ronaldinho, Neymar e Marquinhos deram alma mundial a Paris";
  const brDossierDescription = "Dossiê original em português do Brasil sobre a influência brasileira no PSG: Raí, Ronaldinho, Neymar, Thiago Silva, Marquinhos e a memória parisiense.";
  const brDossierDeck = "O PSG não contratou apenas jogadores brasileiros. Em momentos decisivos, Paris buscou no Brasil uma parte do seu imaginário: liderança, fantasia, autoridade, excesso, debate e fascínio mundial.";
  const brDossierCard = `<article class="news-card" data-share-title="${escapeHTML(brDossierTitle)}" data-share-url="${escapeHTML(brDossierPath)}">
            <time class="news-date" datetime="2026-09-06T09:20:00+02:00">6 de setembro de 2026 · 09:20</time>
            <div class="news-topline"><span>Dossiê Brasil</span><strong>Análise histórica</strong></div>
            <h3><a href="${escapeHTML(brDossierPath)}">${escapeHTML(brDossierTitle)}</a></h3>
            <p>${escapeHTML(brDossierDeck)}</p>
            <a href="${escapeHTML(brDossierPath)}">Ler o dossiê</a>
          </article>`;
  const brDossierJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${siteUrl}${brDossierPath}#article`,
        mainEntityOfPage: { "@type": "WebPage", "@id": `${siteUrl}${brDossierPath}` },
        headline: brDossierTitle,
        description: brDossierDescription,
        datePublished: "2026-09-06T09:20:00+02:00",
        dateModified: editorialArticlesMeta.updatedAt,
        inLanguage: "pt-BR",
        author: { "@type": "Organization", name: "Parisien 90", url: siteUrl },
        publisher: { "@type": "NewsMediaOrganization", name: "Parisien 90", url: siteUrl },
        image: [heroImage],
        about: { "@type": "SportsTeam", name: "Paris Saint-Germain" },
        mentions: ["Raí", "Ronaldinho", "Neymar", "Thiago Silva", "Marquinhos", "Paris Saint-Germain"]
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${siteUrl}${brDossierPath}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Início", item: `${siteUrl}/br/` },
          { "@type": "ListItem", position: 2, name: "Dossiês PSG", item: `${siteUrl}/br/dossies-psg/` },
          { "@type": "ListItem", position: 3, name: "Brasileiros no PSG", item: `${siteUrl}${brDossierPath}` }
        ]
      },
      {
        "@type": "FAQPage",
        "@id": `${siteUrl}${brDossierPath}#faq`,
        inLanguage: "pt-BR",
        mainEntity: [
          {
            "@type": "Question",
            name: "Quais brasileiros marcaram mais a história do PSG?",
            acceptedAnswer: { "@type": "Answer", text: "Raí, Ronaldinho, Neymar, Thiago Silva e Marquinhos estão entre os nomes mais fortes, por liderança, fantasia, impacto mundial, autoridade defensiva e longevidade." }
          },
          {
            "@type": "Question",
            name: "Por que o PSG interessa ao público brasileiro?",
            acceptedAnswer: { "@type": "Answer", text: "Porque o clube mistura estrelas, Liga dos Campeões, mercado, debate e uma longa lista de brasileiros que criaram pontes reais entre Paris e o futebol brasileiro." }
          }
        ]
      }
    ]
  };

  const homeJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Parisien 90 Brasil",
    url: `${siteUrl}/br/`,
    inLanguage: "pt-BR",
    about: { "@type": "SportsTeam", name: "Paris Saint-Germain" },
    publisher: { "@type": "NewsMediaOrganization", name: "Parisien 90", url: siteUrl }
  };

  const pages = [
    {
      path: "/br/",
      title: "PSG em português do Brasil: notícias, mercado e história | Parisien 90",
      description: "Parisien 90 Brasil acompanha o PSG em português: notícias, transferências, jogadores, brasileiros no clube, história e calendário.",
      active: "home",
      frPath: "/",
      jsonLd: homeJsonLd,
      body: `<section class="hero-section br-hero">
        <div class="hero-visual" aria-hidden="true"></div>
        <div class="hero-copy">
          <div class="live-chip">Redação PSG Brasil</div>
          <h1>PSG em português do Brasil</h1>
          <p>Parisien 90 abre sua ponte brasileira: notícias do Paris Saint-Germain, mercado, Liga dos Campeões, jogadores e a linhagem verde-amarela que ajudou a construir o mito parisiense.</p>
          <div class="hero-actions">
            <a class="primary-action" href="/br/brasileiros-no-psg/">Ver brasileiros no PSG</a>
            <a class="secondary-action" href="/br/transferencias-psg/">Transferências PSG</a>
            <a class="secondary-action" href="/br/noticias-psg/">Notícias</a>
            <a class="secondary-action" href="/br/jogadores-psg/">Jogadores</a>
            <a class="secondary-action" href="/br/antigos-jogadores-psg/">Ídolos</a>
          </div>
        </div>
        <aside class="hero-news" aria-label="Destaque Brasil">
          <span class="section-kicker">Destaque</span>
          <time class="news-date" datetime="${escapeHTML(brLatest[0] ? itemDateTimeISO(brLatest[0].item) : newsMeta.updatedAt)}">${escapeHTML(brLatest[0] ? `${brDateLabel(brLatest[0].item.dateLabel)} · ${brLatest[0].item.time}` : brDateLabel(newsMeta.displayDate))}</time>
          <h2>${escapeHTML(brLatest[0]?.title || "Parisien 90 Brasil está no ar")}</h2>
          <p>${escapeHTML(brLatest[0]?.summary || "A versão brasileira começa pelos temas mais fortes: mercado, elenco, calendário europeu, história e brasileiros do PSG.")}</p>
        </aside>
      </section>
      <section class="signal-strip" aria-label="Indicadores Brasil PSG">
        <article class="signal-card"><span>Notícias no fio</span><strong>${escapeHTML(publishedNewsFeed.length)}</strong></article>
        <article class="signal-card tone-green"><span>Brasileiros mapeados</span><strong>${escapeHTML(brazilianCount)}</strong></article>
        <article class="signal-card tone-red"><span>Calendário 26/27</span><strong>${escapeHTML(psgSchedule2627.length)}</strong></article>
      </section>
      <section class="content-section">
        <span class="section-kicker">Comece aqui</span>
        <h2>O PSG visto do Brasil</h2>
        <p>O Paris Saint-Germain não é apenas um clube francês para o público brasileiro. É Raí levantando taça europeia, Ronaldinho antes do auge, Neymar mudando a escala do projeto, Marquinhos virando capitão e uma lista de craques que liga Paris ao nosso futebol.</p>
        <div class="topic-grid">
          <a class="topic-card" href="/br/mercado-psg/"><span>Mercado</span><h3>Mercado PSG</h3><p>Rumores, chegadas, saídas e leitura de confiança dos movimentos.</p></a>
          <a class="topic-card" href="/br/noticias-psg/"><span>Atualidade</span><h3>Notícias PSG</h3><p>As principais notícias traduzidas e contextualizadas para o leitor brasileiro.</p></a>
          <a class="topic-card" href="/br/historia-psg/"><span>Memória</span><h3>História do PSG</h3><p>Grandes eras, ídolos, noites europeias e viradas do clube.</p></a>
          <a class="topic-card" href="${escapeHTML(brDossierPath)}"><span>Dossiê</span><h3>Brasil e PSG</h3><p>Raí, Ronaldinho, Neymar, Thiago Silva e Marquinhos em uma história feita para o leitor brasileiro.</p></a>
          <a class="topic-card" href="/br/brasileiros-no-psg/"><span>Brasil</span><h3>Brasileiros no PSG</h3><p>Raí, Ronaldinho, Neymar, Thiago Silva, Marquinhos e muito mais.</p></a>
          <a class="topic-card" href="/br/antigos-jogadores-psg/"><span>Ídolos</span><h3>Ídolos do PSG</h3><p>Fichas longas de Neymar, Ronaldinho, Messi, Mbappé, Raí e Thiago Silva.</p></a>
        </div>
      </section>
      <section class="content-section">
        <div class="section-heading"><div><span class="section-kicker">Novo dossiê</span><h2>Brasil e PSG, uma história que prende</h2></div><a class="primary-action compact-action" href="${escapeHTML(brDossierPath)}">Ler</a></div>
        <div class="hot-grid">${brDossierCard}</div>
      </section>
      <section class="content-section">
        <div class="section-heading"><div><span class="section-kicker">Atualidade</span><h2>Notícias PSG em destaque</h2></div><span class="freshness">${escapeHTML(brDateLabel(newsMeta.displayDate))} · ${escapeHTML(newsMeta.displayTime)}</span></div>
        <div class="hot-grid">${newsCards}</div>
      </section>`
    },
    {
      path: "/br/dossies-psg/",
      title: "Dossiês PSG em português do Brasil | Parisien 90 Brasil",
      description: "Dossiês originais em português do Brasil sobre o PSG: brasileiros, ídolos, mercado, jogadores, história e debates do Paris Saint-Germain.",
      active: "dossies",
      frPath: "/dossiers-psg/",
      jsonLd: { ...homeJsonLd, name: "Dossiês PSG Brasil", url: `${siteUrl}/br/dossies-psg/` },
      body: `<section class="page-hero"><span class="section-kicker">Dossiês PSG</span><h1>Histórias do PSG para ler com calma</h1><p>Textos originais em português do Brasil para entender o Paris Saint-Germain além do placar: memória, jogadores, mercado, rivalidades e grandes debates.</p></section>
      <section class="content-section"><div class="section-heading"><div><span class="section-kicker">Hoje</span><h2>Dossiês em destaque</h2></div><span class="freshness">Atualizado em 6 de setembro de 2026</span></div><div class="hot-grid">${brDossierCard}</div></section>
      <section class="content-section"><h2>Continuar a leitura</h2><div class="topic-grid"><a class="topic-card" href="/br/brasileiros-no-psg/"><span>Brasil</span><h3>Brasileiros no PSG</h3><p>A lista e as fichas dos brasileiros que passaram por Paris.</p></a><a class="topic-card" href="/br/antigos-jogadores-psg/"><span>Ídolos</span><h3>Grandes nomes do PSG</h3><p>Neymar, Ronaldinho, Messi, Mbappé, Raí, Thiago Silva e outros.</p></a><a class="topic-card" href="/br/mercado-psg/"><span>Mercado</span><h3>Mercado PSG</h3><p>Rumores e decisões com fonte e contexto.</p></a></div></section>`
    },
    {
      path: brDossierPath,
      title: `${brDossierTitle} | Parisien 90 Brasil`,
      description: brDossierDescription,
      active: "dossies",
      frPath: frBrazilDossierPath,
      jsonLd: brDossierJsonLd,
      body: `<nav class="breadcrumb" aria-label="Trilha de navegação"><a href="/br/">Início</a><span>/</span><a href="/br/dossies-psg/">Dossiês PSG</a><span>/</span><span>Brasileiros no PSG</span></nav>
      <article class="article-page records-page" data-share-title="${escapeHTML(brDossierTitle)}" data-share-url="${escapeHTML(brDossierPath)}">
        <div class="article-hero">
          <div class="item-tags"><span>Dossiê Brasil</span><span>Análise histórica</span><span>9 min</span></div>
          <time datetime="2026-09-06T09:20:00+02:00">6 de setembro de 2026 · 09:20</time>
          <h1>${escapeHTML(brDossierTitle)}</h1>
          <p>${escapeHTML(brDossierDeck)}</p>
        </div>
        <div class="article-layout">
          <div class="article-body">
            <section class="records-section"><h2>O Brasil não é detalhe na história do PSG</h2><p>Quando o torcedor lembra do Paris Saint-Germain, pensa em Paris, estrelas, Liga dos Campeões, mercado e noites de tensão. Mas existe uma linha que atravessa décadas: a linha brasileira. Raí, Valdo, Leonardo, Ronaldinho, Neymar, Thiago Silva, Marquinhos, Lucas Moura, Nenê, Maxwell, Alex e Dani Alves não formam apenas uma lista bonita. Eles contam como Paris aprendeu a falar com o mundo.</p><p>Para o público brasileiro, o PSG tem algo raro: não é um clube distante que só aparece em mata-mata europeu. É um clube onde ídolos nacionais deixaram marca, encantaram, dividiram opiniões e criaram memórias. Essa familiaridade explica por que Paris ainda pode crescer muito no Brasil.</p></section>
            <section class="records-section"><h2>Raí e Ronaldinho: liderança e fantasia</h2><p>Raí simboliza o brasileiro que dá espessura institucional. É capitão, elegância, conquista europeia e memória de uma época em que o PSG ainda construía seu peso continental. Ele não é apenas um antigo jogador; é uma ponte emocional entre Paris e o futebol brasileiro.</p><p>Ronaldinho é o oposto complementar: menos ordem, mais faísca. O PSG teve o gênio antes do auge mundial. Por isso, sua passagem não envelhece. Ela provoca a pergunta que todo torcedor gosta de discutir: Paris viu uma lenda nascer ou perdeu a chance de segurá-la por mais tempo?</p></section>
            <section class="records-section"><h2>Neymar: o brilho que mudou a escala</h2><p>Neymar transformou o PSG em assunto cotidiano no Brasil. Com ele, Paris virou novela mundial: talento absoluto, lesões, cobrança, Champions League, relação com a torcida e sensação de que cada partida carregava algo maior do que o resultado.</p><p>Seu período não precisa ser suavizado para continuar enorme. Pelo contrário: é justamente a mistura de genialidade e frustração que torna Neymar indispensável para entender o PSG moderno. Ele levou o clube a uma audiência global e deixou um debate que ainda rende.</p></section>
            <section class="records-section"><h2>Thiago Silva e Marquinhos: o Brasil da autoridade</h2><p>Nem todo brasileiro do PSG viveu de drible. Thiago Silva e Marquinhos representam outra escola: liderança, leitura, defesa, duração. O primeiro deu credibilidade imediata ao projeto moderno. O segundo atravessou ciclos até se tornar capitão e referência histórica.</p><p>Em um clube muitas vezes julgado pelos atacantes, essa dupla lembra uma verdade simples: potência também se mede pela estabilidade. Paris pode comprar nomes grandes, mas precisa de homens que sustentem a temporada quando a pressão aperta.</p></section>
            <section class="records-section"><h2>A pergunta que fica</h2><p>O PSG seria tão magnético sem o Brasil? Talvez ainda fosse rico, ambicioso e observado. Mas seria menos sensorial, menos discutido, menos ligado a uma ideia de futebol que mistura técnica e emoção.</p><p>A linhagem brasileira deu ao PSG algo que não cabe em uma tabela: memória compartilhável. É o tipo de história que faz o torcedor abrir uma ficha, mandar um link, discordar de um amigo e voltar para ler mais.</p></section>
            <section class="records-section"><h2>FAQ</h2><div class="faq-list"><details open><summary>Quais brasileiros marcaram mais a história do PSG?</summary><p>Raí, Ronaldinho, Neymar, Thiago Silva e Marquinhos estão entre os nomes mais fortes pela combinação de liderança, fantasia, impacto mundial, defesa e longevidade.</p></details><details><summary>Ronaldinho foi importante mesmo ficando pouco tempo?</summary><p>Sim. Sua passagem foi curta, mas ficou enorme na memória porque Paris viu de perto um futuro gênio mundial antes da consagração plena.</p></details><details><summary>O texto copia Wikipedia ou mídia brasileira?</summary><p>Não. O dossiê usa fatos públicos e fontes citadas, mas a redação, a estrutura e o ângulo são originais Parisien 90.</p></details></div></section>
            <section class="source-box"><span>Fontes utilizadas</span><p>Síntese original Parisien 90 baseada em dados públicos. Nenhum texto de terceiros é reproduzido.</p><ul class="source-credit-list"><li><a href="https://pt.wikipedia.org/wiki/Ra%C3%AD" rel="noopener noreferrer">Wikipédia - Raí</a><span>Dados biográficos e carreira pública.</span></li><li><a href="https://pt.wikipedia.org/wiki/Ronaldinho_Ga%C3%BAcho" rel="noopener noreferrer">Wikipédia - Ronaldinho Gaúcho</a><span>Cronologia esportiva pública.</span></li><li><a href="https://pt.wikipedia.org/wiki/Neymar" rel="noopener noreferrer">Wikipédia - Neymar</a><span>Dados de carreira e passagem pelo PSG.</span></li><li><a href="https://pt.wikipedia.org/wiki/Thiago_Silva" rel="noopener noreferrer">Wikipédia - Thiago Silva</a><span>Dados de carreira pública.</span></li><li><a href="/br/brasileiros-no-psg/">Parisien 90 - Brasileiros no PSG</a><span>Lista interna e fichas ligadas.</span></li></ul></section>
          </div>
          <aside class="article-sidebar"><span class="section-kicker">Continuar</span><a href="/br/brasileiros-no-psg/">Brasileiros no PSG</a><a href="/br/antigos-jogadores-psg/ronaldinho/">Ronaldinho PSG</a><a href="/br/antigos-jogadores-psg/neymar/">Neymar PSG</a><a href="/br/jogadores-psg/marquinhos/">Marquinhos PSG</a><a href="/br/historia-psg/">História do PSG</a></aside>
        </div>
      </article>`
    },
    {
      path: "/br/transferencias-psg/",
      title: "Transferências PSG: chegadas, saídas e rumores | Parisien 90 Brasil",
      description: "Transferências do PSG em português do Brasil: rumores, chegadas, saídas, fontes citadas e impacto esportivo no elenco de Luis Enrique.",
      active: "transferencias",
      frPath: "/transfert-psg/",
      jsonLd: { ...homeJsonLd, name: "Transferências PSG", url: `${siteUrl}/br/transferencias-psg/` },
      body: `<section class="page-hero"><span class="section-kicker">Mercado Paris</span><h1>Transferências PSG: o que muda de verdade no time</h1><p>Chegada, saída ou rumor só interessa quando muda o campo: hierarquia, salário, minutos, vestiário e ambição europeia.</p></section>
      <section class="reader-layout">
        <article class="content-section"><h2>Como ler uma transferência do PSG</h2><p>O PSG compra status, mas também compra função. Antes de tratar qualquer nome como solução mágica, Parisien 90 Brasil separa confirmação oficial, negociação avançada, rumor forte e simples barulho de mercado.</p><p>Para o torcedor brasileiro, vale observar três pontos: quem perde espaço, quem ganha proteção na rotação e se a contratação aumenta a chance do PSG competir em noites grandes de Liga dos Campeões.</p></article>
        <aside class="side-panel"><span class="section-kicker">Rotas rápidas</span><h2>Guias ligados</h2><ul class="link-list"><li><a href="/br/noticias-psg/">Notícias em português</a></li><li><a href="/br/mercado-psg/">Mercado PSG ao vivo</a></li><li><a href="/br/jogadores-psg/">Elenco atual</a></li><li><a href="/br/brasileiros-no-psg/">Brasileiros no PSG</a></li><li><a href="/br/antigos-jogadores-psg/">Ídolos do PSG</a></li></ul></aside>
      </section>
      <section class="content-section"><span class="section-kicker">Guia do torcedor</span><h2>Transferências PSG: do rumor ao impacto no elenco</h2><p>Uma transferência do PSG começa com um nome, mas só fica séria quando ganha contexto: contrato, clube envolvido, necessidade de posição, calendário europeu e reação da comissão técnica. Por isso, Parisien 90 Brasil trata cada pista como uma história esportiva, não como uma promessa automática.</p><p>Depois de cada notícia, o leitor encontra caminhos diretos para <a href="/br/mercado-psg/">Mercado PSG</a>, <a href="/br/jogadores-psg/">Jogadores do PSG</a>, <a href="/br/historia-psg/">História do PSG</a>, <a href="/br/brasileiros-no-psg/">Brasileiros no PSG</a> e <a href="/br/dossies-psg/">Dossiês PSG</a>. Assim, uma chegada, uma saída ou um empréstimo vira leitura completa.</p><div class="topic-grid"><a class="topic-card" href="/br/mercado-psg/"><span>Mercado</span><h3>Rumores e bastidores</h3><p>Quem informa, o que existe e o que ainda falta para virar fato.</p></a><a class="topic-card" href="/br/jogadores-psg/"><span>Elenco</span><h3>Quem ganha ou perde espaço</h3><p>A leitura do vestiário, da rotação e das posições mais disputadas.</p></a><a class="topic-card" href="/br/antigos-jogadores-psg/ronaldinho/"><span>História</span><h3>Ronaldinho PSG</h3><p>Um nome mundial para entender o peso internacional de Paris.</p></a></div></section>
      <section class="content-section"><div class="section-heading"><div><span class="section-kicker">Sinais recentes</span><h2>Transferências e decisões quentes</h2></div></div><div class="hot-grid">${newsCards}</div></section>`
    },
    {
      path: "/br/mercado-psg/",
      title: "Mercado PSG em português: rumores e bastidores | Parisien 90 Brasil",
      description: "Mercado do PSG para leitores brasileiros: rumores, bastidores, confiabilidade das fontes e análise do elenco parisiense.",
      active: "mercado",
      frPath: "/mercato-psg/",
      jsonLd: { ...homeJsonLd, name: "Mercado PSG Brasil", url: `${siteUrl}/br/mercado-psg/` },
      body: `<section class="page-hero"><span class="section-kicker">Mercado PSG</span><h1>Mercado PSG: rumor só vale quando tem contexto</h1><p>Paris é gigante, então todo agente quer colocar um nome perto do PSG. A versão Brasil vai direto ao ponto: quem disse, o que existe, o que falta e por que isso importa.</p></section>
      <section class="content-section"><h2>O radar do torcedor brasileiro</h2><p>O mercado do PSG interessa no Brasil porque mistura craques mundiais, brasileiros históricos, dinheiro, Liga dos Campeões e decisões que mudam a hierarquia do elenco. O leitor não precisa de barulho: precisa saber se a informação é oficial, forte, frágil ou apenas debate.</p><div class="method-list"><article><strong>Oficial</strong><p>Comunicado de clube, liga, federação ou competição.</p></article><article><strong>Forte</strong><p>Informação atribuída, recortada e ainda dependente de assinatura ou exame médico.</p></article><article><strong>Debate</strong><p>Leitura editorial sobre impacto técnico, sem vender hipótese como fato.</p></article></div></section>
      <section class="content-section"><span class="section-kicker">Leitura de mercado</span><h2>Mercado PSG: nomes, funções e noites grandes</h2><p>O PSG não entra no mercado apenas para empilhar estrelas. Cada movimento precisa responder a uma pergunta de campo: falta profundidade na defesa? O meio tem intensidade suficiente? O ataque tem finalização, drible e disciplina? E, acima de tudo, o elenco aguenta a sequência de Liga dos Campeões?</p><p>Para acompanhar sem se perder, abra também <a href="/br/transferencias-psg/">Transferências PSG</a>, <a href="/br/noticias-psg/">Notícias PSG</a>, <a href="/br/jogadores-psg/">Jogadores do PSG</a>, <a href="/br/antigos-jogadores-psg/neymar/">Neymar PSG</a> e <a href="/br/antigos-jogadores-psg/lionel-messi/">Messi PSG</a>. As fichas ajudam a comparar o presente com os grandes ciclos do clube.</p><div class="faq-list"><details open><summary>Como saber se uma notícia de mercado do PSG é confiável?</summary><p>Ela deve ter fonte identificada, data, contexto e distância clara entre fato confirmado e hipótese. Parisien 90 Brasil sempre aponta essa diferença.</p></details><details><summary>Qual é a diferença entre mercado PSG e transferências PSG?</summary><p>Mercado é o ambiente inteiro: rumores, necessidades, saídas, entradas e negociações. Transferência é o movimento específico de um jogador.</p></details><details><summary>Por que o mercado do PSG importa para o Brasil?</summary><p>Porque muitos brasileiros marcaram Paris e porque o clube continua sendo um palco mundial para jogadores, técnicos, agentes e torcedores brasileiros.</p></details></div></section>
      <section class="content-section"><div class="section-heading"><div><span class="section-kicker">Agora</span><h2>Notícias de mercado</h2></div></div><div class="hot-grid">${newsCards}</div></section>`
    },
    {
      path: "/br/jogadores-psg/",
      title: "Jogadores do PSG: elenco, craques e brasileiros | Parisien 90 Brasil",
      description: "Elenco do PSG em português do Brasil: jogadores atuais, funções, brasileiros, jovens e nomes decisivos do time de Luis Enrique.",
      active: "jogadores",
      frPath: "/joueurs-psg/",
      jsonLd: { ...homeJsonLd, name: "Jogadores do PSG", url: `${siteUrl}/br/jogadores-psg/` },
      body: `<section class="page-hero"><span class="section-kicker">Elenco</span><h1>Jogadores do PSG: talento, rotação e disputa por minutos</h1><p>O PSG moderno vive de abundância. O desafio de Luis Enrique é transformar estrelas, jovens e especialistas em uma equipe legível.</p></section>
      <section class="content-section"><div class="section-heading"><div><span class="section-kicker">Perfis atuais</span><h2>Jogadores para acompanhar</h2></div><a class="primary-action compact-action" href="/br/brasileiros-no-psg/">Ver brasileiros</a></div><div class="topic-grid">${playerCards}</div></section>
      <section class="content-section"><h2>Por que o elenco interessa no Brasil</h2><p>O torcedor brasileiro costuma olhar o PSG por nomes, estilo e noites grandes. Marquinhos e Lucas Beraldo mantêm a conexão direta com o Brasil, enquanto Dembélé, Vitinha, João Neves, Doué e Kvaratskhelia explicam a nova identidade coletiva de Paris.</p></section>`
    },
    {
      path: "/br/historia-psg/",
      title: "História do PSG: títulos, ídolos e eras do clube | Parisien 90 Brasil",
      description: "História do Paris Saint-Germain em português: nascimento do clube, grandes eras, ídolos, títulos, brasileiros e noites europeias.",
      active: "historia",
      frPath: "/histoire-psg/",
      jsonLd: { ...homeJsonLd, name: "História do PSG", url: `${siteUrl}/br/historia-psg/` },
      body: `<section class="page-hero"><span class="section-kicker">História PSG</span><h1>História do PSG: de clube jovem a potência mundial</h1><p>Paris não nasceu gigante, mas virou uma marca global porque juntou cidade, ambição, estrelas, rivalidades e noites europeias que moldaram sua identidade.</p></section>
      <section class="reader-layout"><article class="content-section"><h2>As eras que explicam Paris</h2><p>O PSG dos anos 70 e 80 constrói base e primeiros títulos. A era Canal+ dá peso europeu e noites de Copa. O ciclo QSI muda escala, dinheiro, pressão e expectativa mundial. Hoje, o clube tenta transformar poder em cultura vencedora permanente.</p><p>Para o Brasil, a história fica ainda mais próxima: Raí, Valdo, Leonardo, Ronaldinho, Thiago Silva, Neymar e Marquinhos não são detalhes. Eles são capítulos centrais.</p></article><aside class="side-panel"><span class="section-kicker">Memória</span><h2>Ídolos para abrir</h2><ul class="link-list"><li><a href="/br/antigos-jogadores-psg/rai/">Raí PSG</a></li><li><a href="/br/antigos-jogadores-psg/ronaldinho/">Ronaldinho PSG</a></li><li><a href="/br/antigos-jogadores-psg/neymar/">Neymar PSG</a></li><li><a href="/br/antigos-jogadores-psg/lionel-messi/">Messi PSG</a></li><li><a href="/br/antigos-jogadores-psg/kylian-mbappe/">Mbappé PSG</a></li><li><a href="/br/brasileiros-no-psg/">Brasileiros no PSG</a></li></ul></aside></section>
      <section class="content-section"><div class="topic-grid">${legendPreviewCards}</div></section>`
    },
    {
      path: "/br/brasileiros-no-psg/",
      title: "Brasileiros no PSG: Raí, Ronaldinho, Neymar e Marquinhos | Parisien 90",
      description: "Lista e histórias dos brasileiros no PSG: Raí, Ronaldinho, Neymar, Thiago Silva, Marquinhos, Lucas Moura, Leonardo, Nenê, Maxwell e outros.",
      active: "brasileiros",
      frPath: "/anciens-joueurs-psg/?pays=Brésil",
      jsonLd: { ...homeJsonLd, name: "Brasileiros no PSG", url: `${siteUrl}/br/brasileiros-no-psg/` },
      body: `<section class="page-hero"><span class="section-kicker">Brasil em Paris</span><h1>Brasileiros no PSG: a linhagem que deu alma mundial a Paris</h1><p>Raí deu nobreza, Ronaldinho deu fantasia, Neymar deu escala global, Thiago Silva deu autoridade, Marquinhos deu duração. O PSG fala português muito antes de querer falar com o mundo inteiro.</p></section>
      <section class="signal-strip" aria-label="Brasileiros e sul-americanos no PSG"><article class="signal-card tone-green"><span>Brasileiros mapeados</span><strong>${escapeHTML(brazilianCount)}</strong></article><article class="signal-card"><span>Argentinos mapeados</span><strong>${escapeHTML(argentinianCount)}</strong></article><article class="signal-card tone-red"><span>Fichas em destaque</span><strong>${escapeHTML(brazilianLegends.length)}</strong></article></section>
      <section class="content-section"><h2>Por que essa lista importa</h2><p>O PSG tem uma relação rara com o futebol brasileiro. Não é só contratação de craque: é estética, liderança, marketing, memória e identidade. De Raí a Marquinhos, o Brasil aparece nos momentos em que Paris tenta se definir para além da França.</p><p>As fichas abaixo usam dados públicos e fontes citadas. As fotos só aparecem quando existe licença aberta ou autorização clara.</p></section>
      <section class="content-section"><div class="section-heading"><div><span class="section-kicker">Dossiê recomendado</span><h2>Por que o Brasil moldou Paris</h2></div><a class="primary-action compact-action" href="${escapeHTML(brDossierPath)}">Ler o dossiê</a></div><div class="hot-grid">${brDossierCard}</div></section>
      <section class="content-section"><div class="section-heading"><div><span class="section-kicker">Galeria editorial</span><h2>Grandes brasileiros do PSG</h2></div><a class="primary-action compact-action" href="/br/antigos-jogadores-psg/">Ver ídolos</a></div><div class="topic-grid">${legendCards}</div></section>
      <section class="content-section"><h2>Próximos jogos que o Brasil deve olhar</h2><div class="hot-grid">${fixtureCards}</div></section>`
    }
  ];

  return pages.map((page) => ({ path: page.path, html: makeBrPage(page) }));
};

const newsPayload = {
  updatedAt: newsMeta.updatedAt,
  edition: newsMeta.edition,
  displayDate: newsMeta.displayDate,
  displayTime: newsMeta.displayTime,
  rightsNote: newsMeta.rightsNote,
  count: publishedNewsFeed.length,
  items: publishedNewsFeed.map((item) => ({
    count: publishedNewsFeed.length,
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

const editorialPayload = {
  updatedAt: editorialArticlesMeta.updatedAt,
  displayDate: editorialArticlesMeta.displayDate,
  displayTime: editorialArticlesMeta.displayTime,
  cadence: editorialArticlesMeta.cadence,
  rightsNote: editorialArticlesMeta.rightsNote,
  count: editorialArticles.length,
  items: editorialArticles.map((item) => ({
    id: item.id,
    category: item.category,
    angle: item.angle,
    date: item.date,
    dateLabel: item.dateLabel,
    time: item.time,
    dateTime: `${item.date}T${item.time}:00+02:00`,
    headline: item.title,
    summary: item.deck,
    internalUrl: editorialUrl(item),
    sources: item.sources,
    keywords: item.keywords
  }))
};

await writeFile(new URL("editorial-articles.json", publicDir), `${JSON.stringify(editorialPayload, null, 2)}\n`, "utf8");

await rm(newsDir, { recursive: true, force: true });
await mkdir(newsDir, { recursive: true });

await Promise.all(
  publishedNewsFeed.map(async (item) => {
    const articleDir = new URL(`${slugify(item.id)}/`, newsDir);
    await mkdir(articleDir, { recursive: true });
    await writeFile(new URL("index.html", articleDir), makeArticlePage(item), "utf8");
  })
);

await rm(dossiersDir, { recursive: true, force: true });
await mkdir(dossiersDir, { recursive: true });
await writeFile(new URL("index.html", dossiersDir), makeEditorialIndexPage(), "utf8");

await Promise.all(
  editorialArticles.map(async (item) => {
    const articleDir = new URL(`${slugify(item.id)}/`, dossiersDir);
    await mkdir(articleDir, { recursive: true });
    await writeFile(new URL("index.html", articleDir), makeEditorialArticlePage(item), "utf8");
  })
);

const profilePages = [
  ...currentPlayerProfiles.map((profile) => ({
    profile,
    type: "player",
    path: currentPlayerPath(profile),
    url: currentPlayerUrl(profile),
    parentPath: "/joueurs-psg/",
    parentName: "Joueurs PSG"
  })),
  ...staffProfiles.map((profile) => ({
    profile,
    type: "staff",
    path: staffPath(profile),
    url: staffUrl(profile),
    parentPath: "/joueurs-psg/",
    parentName: "Staff PSG"
  })),
  ...legendProfiles.map((profile) => ({
    profile,
    type: "legend",
    path: legendPath(profile),
    url: legendUrl(profile),
    parentPath: "/histoire-psg/",
    parentName: "Histoire PSG"
  }))
];
const allTimePlayerIndex = buildAllTimePlayerIndex(profilePages);

await Promise.all(
  profilePages.map(async (page) => {
    const baseDir = page.type === "legend" ? legendsDir : page.type === "staff" ? staffDir : playersDir;
    const profileDir = new URL(`${slugify(page.profile.id)}/`, baseDir);
    await mkdir(profileDir, { recursive: true });
    await writeFile(new URL("index.html", profileDir), makeProfilePage(page), "utf8");
  })
);
await writeFile(new URL("index.html", legendsDir), makeAllTimePlayersPage(allTimePlayerIndex), "utf8");

const brazilProfilePages = makeBrazilProfilePages();
const brazilNewsPages = makeBrNewsPages();
const brazilPages = [...makeBrazilPages(allTimePlayerIndex), ...brazilProfilePages, ...brazilNewsPages];
await rm(brDir, { recursive: true, force: true });
await mkdir(brDir, { recursive: true });
await Promise.all(
  brazilPages.map(async (page) => {
    const pageDir = new URL(page.path.replace(/^\/br\/?/, ""), brDir);
    await mkdir(pageDir, { recursive: true });
    await writeFile(new URL("index.html", pageDir), page.html, "utf8");
  })
);

const rssItems = publishedNewsFeed.slice(0, 24).map((item) => {
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
aiIndex.site.freshnessNote = `${newsMeta.edition}. Fil public : ${publishedNewsFeed.length} vraies infos PSG, avec pages individuelles sous /news/. Dossiers originaux : ${editorialArticles.length} articles de fond sous /dossiers-psg/. À suivre : ${freshnessSummary}. Synthèses originales, sourcées et liées.`;
if (aiIndex.site.primaryQueries) {
  aiIndex.site.primaryTopics = aiIndex.site.primaryQueries;
  delete aiIndex.site.primaryQueries;
}
const editorialPriorityPage = {
  url: `${siteUrl}/dossiers-psg/`,
  title: "Dossiers PSG : analyses originales, histoire et joueurs",
  intent: "Lire les articles de fond originaux Parisien 90 sur les anciens joueurs, l'effectif, le mercato, l'histoire et les débats PSG",
  topics: [
    "dossiers PSG",
    "analyse PSG",
    "article de fond PSG",
    "histoire PSG",
    "joueurs PSG analyse",
    "débats PSG"
  ]
};
aiIndex.priorityPages = [
  editorialPriorityPage,
  ...(aiIndex.priorityPages || []).filter((page) => page.url !== editorialPriorityPage.url)
].map((page) => {
  if (!page.queries) return page;
  const { queries, ...rest } = page;
  return { ...rest, topics: queries };
});
aiIndex.news = publishedNewsFeed.slice(0, 30).map((item) => ({
  title: item.title,
  category: item.category,
  dateTime: itemDateTimeISO(item),
  url: itemUrl(item),
  source: item.source,
  sourceUrl: sourceUrl(item),
  reliability: item.reliability
}));
aiIndex.brazilNews = getBrLatestStories().map((story) => ({
  title: story.title,
  category: brCompetitionLabel(story.item.category),
  dateTime: itemDateTimeISO(story.item),
  url: brItemUrl(story.item),
  frenchUrl: itemUrl(story.item),
  source: story.item.source,
  sourceUrl: sourceUrl(story.item),
  reliability: brReliabilityLabel(story.item.reliability)
}));
aiIndex.editorialArticles = editorialArticles.slice(0, 20).map((item) => ({
  title: item.title,
  category: item.category,
  angle: item.angle,
  dateTime: `${item.date}T${item.time}:00+02:00`,
  url: editorialUrl(item),
  summary: item.deck,
  keywords: item.keywords,
  sources: item.sources
}));
aiIndex.people = profilePages.slice(0, 80).map((page) => ({
  name: page.profile.name,
  aliases: page.profile.aliases || [],
  type: page.type,
  role: page.profile.role || page.profile.position,
  status: page.profile.status || page.profile.lifeStatus,
  url: page.url,
  updatedAt: page.profile.updatedAt || newsMeta.displayDate,
  source: page.profile.source || "Synthèse éditoriale Parisien 90",
  image: page.profile.image
    ? {
        url: page.profile.image.url,
        absoluteUrl: assetUrl(page.profile.image.url),
        credit: page.profile.image.credit,
        license: page.profile.image.license,
        licenseUrl: page.profile.image.licenseUrl,
        sourceUrl: page.profile.image.sourceUrl
      }
    : null
}));
aiIndex.allTimePsgPlayers = {
  count: allTimePlayerIndex.length,
  sourceName: allTimePsgPlayersMeta.sourceName,
  sourceLicense: allTimePsgPlayersMeta.sourceLicense,
  sourceUrl: allTimePsgPlayersMeta.sourceUrl,
  url: `${siteUrl}/anciens-joueurs-psg/`,
  nationalityBreakdown: (() => {
    const counts = new Map();
    allTimePlayerIndex.forEach((player) => {
      splitCountries(player.countries).forEach((country) => {
        const key = countryKey(country);
        if (!key) return;
        const existing = counts.get(key) || { country, count: 0 };
        existing.count += 1;
        counts.set(key, existing);
      });
    });
    return Array.from(counts.values())
      .sort((a, b) => b.count - a.count || a.country.localeCompare(b.country, "fr", { sensitivity: "base" }))
      .slice(0, 20);
  })(),
  keyTopics: [
    "anciens joueurs PSG",
    "liste joueurs PSG",
    "Brésiliens PSG",
    "Argentins PSG",
    "nationalité joueurs PSG",
    "Messi PSG",
    "Neymar PSG",
    "Mbappé PSG",
    "Ronaldinho PSG"
  ],
  featuredNames: allTimePlayerIndex.filter((player) => player.profilePath).slice(0, 80).map((player) => ({
    name: player.name,
    url: player.profileUrl
  }))
};
await writeFile(aiIndexPath, `${JSON.stringify(aiIndex, null, 2)}\n`, "utf8");

const freshnessLine = `Repère éditorial : ${newsMeta.displayDate}, ${newsMeta.displayTime} (Europe/Paris). ${newsMeta.edition}. Fil public : ${publishedNewsFeed.length} vraies infos PSG. Dossiers originaux : ${editorialArticles.length} articles de fond sous /dossiers-psg/, avec sources factuelles citées, angle Parisien 90, FAQ et liens internes utiles. Chaque news importante dispose d'une page individuelle sous /news/ avec date, heure et source citée. Le fil public ne contient que des contenus éditoriaux sourcés. À suivre : ${freshnessSummary}. Les sources sont citées et liées ; aucun article tiers n'est reproduit.`;

const llmsPath = new URL("llms.txt", publicDir);
const llms = await readFile(llmsPath, "utf8");
await writeFile(
  llmsPath,
  llms.replace(/^(Dernière vérification éditoriale|Repère éditorial) : .+$/m, freshnessLine),
  "utf8"
);

const llmsFullPath = new URL("llms-full.txt", publicDir);
const llmsFull = await readFile(llmsFullPath, "utf8");
await writeFile(
  llmsFullPath,
  llmsFull.replace(
    /## (Signal de fraîcheur|Repère éditorial)[\s\S]*?\n\nLe contenu est organisé/,
    `## Repère éditorial — ${newsMeta.displayDate}, ${newsMeta.displayTime} (Europe/Paris)\n\n${newsMeta.edition}. Fil public : ${publishedNewsFeed.length} vraies infos PSG, enrichies en pages individuelles sous /news/. Dossiers originaux : ${editorialArticles.length} articles de fond sous /dossiers-psg/ avec sources citées, angle éditorial, FAQ et liens internes utiles. Le fil public ne contient que des contenus éditoriaux sourcés. À suivre : ${freshnessSummary}. Les informations sont réécrites, sourcées, catégorisées et partageables sans reproduire les articles tiers.\n\nLe contenu est organisé`
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
  ...publishedNewsFeed.map((item) => ({
    loc: itemUrl(item),
    lastmod: item.date || currentDate,
    changefreq: "weekly",
    priority: Number(item.viral) >= 90 ? "0.85" : "0.75"
  })),
  ...editorialArticles.map((item) => ({
    loc: editorialUrl(item),
    lastmod: item.date || currentDate,
    changefreq: "monthly",
    priority: "0.82"
  })),
  ...profilePages.map((page) => ({
    loc: page.url,
    lastmod: currentDate,
    changefreq: "weekly",
    priority: page.type === "player" ? "0.72" : "0.62"
  })),
  ...brazilProfilePages.filter((page) => page.type !== "br-profile-index").map((page) => ({
    loc: page.url,
    lastmod: currentDate,
    changefreq: "weekly",
    priority: page.type === "br-player" ? "0.76" : "0.74"
  })),
  ...brazilNewsPages.filter((page) => page.type === "br-news").map((page) => ({
    loc: page.url,
    lastmod: currentDate,
    changefreq: "weekly",
    priority: "0.78"
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

console.log(`News sync complete: ${publishedNewsFeed.length} published items, ${newsFeed.length} source items, ${newsMeta.edition}, ${sitemapUrls.length} sitemap URLs.`);
