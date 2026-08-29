import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { allTimePsgPlayers, allTimePsgPlayersMeta } from "../src/all-time-psg-players.js";
import { currentPlayerProfiles, legendProfiles, newsFeed, newsMeta, staffProfiles } from "../src/site-data.js";

const siteUrl = "https://parisien90.com";
const publicDir = new URL("../public/", import.meta.url);
const newsDir = new URL("../news/", import.meta.url);
const playersDir = new URL("../joueurs-psg/", import.meta.url);
const legendsDir = new URL("../anciens-joueurs-psg/", import.meta.url);
const staffDir = new URL("../staff-psg/", import.meta.url);
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

  return `
            <h2>Ce qui est établi</h2>
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
        keywords: ["PSG", "Paris Saint-Germain", "actualité PSG", "transfert PSG", "mercato PSG", item.category],
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
            <h2>Méthode et prudence</h2>
            <p>Les informations personnelles sensibles ne sont pas utilisées. Les données affichées restent limitées à l'intérêt sportif, historique ou éditorial : poste, rôle, période PSG, statut public et source de vérification.</p>
          </div>
          <aside class="article-sidebar">
            ${photoMarkup}
            <span class="section-kicker">Continuer</span>
            <a href="/joueurs-psg/">Effectif PSG</a>
            <a href="/records-psg/">Records PSG</a>
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

await rm(newsDir, { recursive: true, force: true });
await mkdir(newsDir, { recursive: true });

await Promise.all(
  publishedNewsFeed.map(async (item) => {
    const articleDir = new URL(`${slugify(item.id)}/`, newsDir);
    await mkdir(articleDir, { recursive: true });
    await writeFile(new URL("index.html", articleDir), makeArticlePage(item), "utf8");
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
aiIndex.site.freshnessNote = `${newsMeta.edition}. Fil public : ${publishedNewsFeed.length} vraies infos PSG, avec pages individuelles crawlables sous /news/. À suivre : ${freshnessSummary}. Synthèses originales, sourcées et liées.`;
aiIndex.news = publishedNewsFeed.slice(0, 30).map((item) => ({
  title: item.title,
  category: item.category,
  dateTime: itemDateTimeISO(item),
  url: itemUrl(item),
  source: item.source,
  sourceUrl: sourceUrl(item),
  reliability: item.reliability
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
  keyQueries: [
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

const freshnessLine = `Repère éditorial : ${newsMeta.displayDate}, ${newsMeta.displayTime} (Europe/Paris). ${newsMeta.edition}. Fil public : ${publishedNewsFeed.length} vraies infos PSG. Chaque news importante dispose d'une page individuelle sous /news/ avec date, heure, source citée, balisage NewsArticle et liens internes. Le fil public ne contient que des contenus éditoriaux sourcés. À suivre : ${freshnessSummary}. Les sources sont citées et liées ; aucun article tiers n'est reproduit.`;

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
    `## Repère éditorial — ${newsMeta.displayDate}, ${newsMeta.displayTime} (Europe/Paris)\n\n${newsMeta.edition}. Fil public : ${publishedNewsFeed.length} vraies infos PSG, enrichies en pages individuelles crawlables sous /news/. Le fil public ne contient que des contenus éditoriaux sourcés. À suivre : ${freshnessSummary}. Les informations sont réécrites, sourcées, catégorisées, partageables et balisées en NewsArticle sans reproduire les articles tiers.\n\nLe contenu est organisé`
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
