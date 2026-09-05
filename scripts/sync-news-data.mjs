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
  { path: "/br/transferencias-psg/", changefreq: "daily", priority: "0.78" },
  { path: "/br/mercado-psg/", changefreq: "daily", priority: "0.78" },
  { path: "/br/jogadores-psg/", changefreq: "weekly", priority: "0.72" },
  { path: "/br/historia-psg/", changefreq: "weekly", priority: "0.72" },
  { path: "/br/brasileiros-no-psg/", changefreq: "weekly", priority: "0.8" },
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
const editorialPath = (item) => `/dossiers-psg/${slugify(item.id)}/`;
const editorialUrl = (item) => `${siteUrl}${editorialPath(item)}`;
const sourceUrl = (item) => new URL(item.url, siteUrl).href;
const currentPlayerPath = (profile) => `/joueurs-psg/${slugify(profile.id)}/`;
const currentPlayerUrl = (profile) => `${siteUrl}${currentPlayerPath(profile)}`;
const legendPath = (profile) => `/anciens-joueurs-psg/${slugify(profile.id)}/`;
const legendUrl = (profile) => `${siteUrl}${legendPath(profile)}`;
const staffPath = (profile) => `/staff-psg/${slugify(profile.id)}/`;
const staffUrl = (profile) => `${siteUrl}${staffPath(profile)}`;
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
            <p>La suite dépendra souvent d'un détail concret : une nouvelle convocation, un communiqué, une programmation, une évolution de prix, une image d'entraînement, un changement de groupe ou une confirmation d'instance. C'est précisément ce type de signal que Parisien 90 relie au fil live et aux pages piliers.</p>
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
    <meta property="og:description" content="Deux articles de fond PSG par jour : histoire, joueurs, mercato, débats et mémoire du club." />
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
          Deux articles de fond par jour pour renforcer Parisien 90 : anciens joueurs, effectif actuel, histoire,
          mercato, débats et récits pensés pour les supporters qui veulent aller plus loin.
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
  const seoFocusMarkup = Array.isArray(profile.seoFocus) && profile.seoFocus.length
    ? `<h2>${escapeHTML(profile.seoFocusTitle || `${profile.name} PSG : pourquoi cette recherche compte`)}</h2>
            ${profile.seoFocus.map((paragraph) => `<p>${escapeHTML(paragraph)}</p>`).join("\n            ")}`
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
            ${seoFocusMarkup}
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
    .replace("décembre", "dezembro");

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

const makeBrHeader = (active) => {
  const links = [
    ["/br/", "Início", "home"],
    ["/br/transferencias-psg/", "Transferências", "transferencias"],
    ["/br/mercado-psg/", "Mercado", "mercado"],
    ["/br/jogadores-psg/", "Jogadores", "jogadores"],
    ["/br/historia-psg/", "História", "historia"],
    ["/br/brasileiros-no-psg/", "Brasileiros", "brasileiros"],
    ["/", "FR", "fr"]
  ];

  return `<header class="site-header">
      <a class="brand" href="/br/" aria-label="Parisien 90 Brasil">
        <span class="brand-mark">P90</span>
        <span><strong>Parisien 90</strong><small>Brasil PSG desk</small></span>
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
      <a href="/droits-disclaimer/">Direitos & disclaimer</a>
      <a href="/contact-retrait/">Contato / remoção</a>
      <a href="/">Versão francesa</a>
    </footer>
    <script type="module" src="/src/site.js"></script>
  </body>
</html>`;
};

const makeBrazilPages = (allTimePlayerIndex) => {
  const brLatest = brStoryTranslations
    .map((story) => ({ ...story, item: publishedNewsFeed.find((item) => item.id === story.id) }))
    .filter((story) => story.item);
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
      (story) => `<article class="news-card" data-share-title="${escapeHTML(story.title)}" data-share-url="${escapeHTML(story.item ? itemPath(story.item) : "/br/")}">
          <time class="news-date" datetime="${escapeHTML(itemDateTimeISO(story.item))}">${escapeHTML(brDateLabel(story.item.dateLabel || newsMeta.displayDate))} · ${escapeHTML(story.item.time)}</time>
          <div class="news-topline"><span>${escapeHTML(brCompetitionLabel(story.item.category))}</span><strong>${escapeHTML(story.item.reliability)}</strong></div>
          <h3><a href="${escapeHTML(itemPath(story.item))}">${escapeHTML(story.title)}</a></h3>
          <p>${escapeHTML(story.summary)}</p>
          <a href="${escapeHTML(sourceUrl(story.item))}" rel="noopener noreferrer">Fonte: ${escapeHTML(story.item.source)}</a>
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
      (profile) => `<a class="topic-card" href="${escapeHTML(currentPlayerPath(profile))}">
          <span>${escapeHTML(profile.number || profile.line || "PSG")}</span>
          <h3>${escapeHTML(profile.name)}</h3>
          <p>${escapeHTML(brProfileCopy[profile.id] || profile.profile)}</p>
        </a>`
    )
    .join("\n");

  const legendCards = brazilianLegends
    .map(
      (profile) => `<a class="topic-card" href="${escapeHTML(legendPath(profile))}">
          <span>${escapeHTML(profile.psgPeriod || "PSG")}</span>
          <h3>${escapeHTML(profile.name)}</h3>
          <p>${escapeHTML(brLegendCopy[profile.id] || profile.profile)}</p>
        </a>`
    )
    .join("\n");
  const legendPreviewCards = brazilianLegends
    .slice(0, 6)
    .map(
      (profile) => `<a class="topic-card" href="${escapeHTML(legendPath(profile))}">
          <span>${escapeHTML(profile.psgPeriod || "PSG")}</span>
          <h3>${escapeHTML(profile.name)}</h3>
          <p>${escapeHTML(brLegendCopy[profile.id] || profile.profile)}</p>
        </a>`
    )
    .join("\n");

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
          <div class="live-chip">Brasil PSG desk</div>
          <h1>PSG em português do Brasil</h1>
          <p>Parisien 90 abre sua ponte brasileira: notícias do Paris Saint-Germain, mercado, Liga dos Campeões, jogadores e a linhagem verde-amarela que ajudou a construir o mito parisiense.</p>
          <div class="hero-actions">
            <a class="primary-action" href="/br/brasileiros-no-psg/">Ver brasileiros no PSG</a>
            <a class="secondary-action" href="/br/transferencias-psg/">Transferências PSG</a>
            <a class="secondary-action" href="/br/jogadores-psg/">Jogadores</a>
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
          <a class="topic-card" href="/br/historia-psg/"><span>Memória</span><h3>História do PSG</h3><p>Grandes eras, ídolos, noites europeias e viradas do clube.</p></a>
          <a class="topic-card" href="/br/brasileiros-no-psg/"><span>Brasil</span><h3>Brasileiros no PSG</h3><p>Raí, Ronaldinho, Neymar, Thiago Silva, Marquinhos e muito mais.</p></a>
        </div>
      </section>
      <section class="content-section">
        <div class="section-heading"><div><span class="section-kicker">Atualidade</span><h2>Notícias PSG em destaque</h2></div><span class="freshness">${escapeHTML(brDateLabel(newsMeta.displayDate))} · ${escapeHTML(newsMeta.displayTime)}</span></div>
        <div class="hot-grid">${newsCards}</div>
      </section>`
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
        <aside class="side-panel"><span class="section-kicker">Rotas rápidas</span><h2>Guias ligados</h2><ul class="link-list"><li><a href="/br/mercado-psg/">Mercado PSG ao vivo</a></li><li><a href="/br/jogadores-psg/">Elenco atual</a></li><li><a href="/br/brasileiros-no-psg/">Brasileiros no PSG</a></li><li><a href="/transfert-psg/">Versão francesa completa</a></li></ul></aside>
      </section>
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
      <section class="content-section"><h2>O radar do torcedor brasileiro</h2><div class="method-list"><article><strong>Oficial</strong><p>Comunicado de clube, liga, federação ou competição.</p></article><article><strong>Forte</strong><p>Informação atribuída, recortada e ainda dependente de assinatura ou exame médico.</p></article><article><strong>Debate</strong><p>Leitura editorial sobre impacto técnico, sem vender hipótese como fato.</p></article></div></section>
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
      <section class="content-section"><div class="section-heading"><div><span class="section-kicker">Perfis atuais</span><h2>Jogadores para acompanhar</h2></div><a class="primary-action compact-action" href="/joueurs-psg/">Todas as fichas em francês</a></div><div class="topic-grid">${playerCards}</div></section>
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
      <section class="reader-layout"><article class="content-section"><h2>As eras que explicam Paris</h2><p>O PSG dos anos 70 e 80 constrói base e primeiros títulos. A era Canal+ dá peso europeu e noites de Copa. O ciclo QSI muda escala, dinheiro, pressão e expectativa mundial. Hoje, o clube tenta transformar poder em cultura vencedora permanente.</p><p>Para o Brasil, a história fica ainda mais próxima: Raí, Valdo, Leonardo, Ronaldinho, Thiago Silva, Neymar e Marquinhos não são detalhes. Eles são capítulos centrais.</p></article><aside class="side-panel"><span class="section-kicker">Memória</span><h2>Ídolos para abrir</h2><ul class="link-list"><li><a href="/anciens-joueurs-psg/rai/">Raí PSG</a></li><li><a href="/anciens-joueurs-psg/ronaldinho/">Ronaldinho PSG</a></li><li><a href="/anciens-joueurs-psg/neymar/">Neymar PSG</a></li><li><a href="/records-psg/">Recordes e números</a></li></ul></aside></section>
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
      <section class="content-section"><div class="section-heading"><div><span class="section-kicker">Galeria editorial</span><h2>Grandes brasileiros do PSG</h2></div><a class="primary-action compact-action" href="/anciens-joueurs-psg/?pays=Brésil">Lista completa</a></div><div class="topic-grid">${legendCards}</div></section>
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

const brazilPages = makeBrazilPages(allTimePlayerIndex);
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
