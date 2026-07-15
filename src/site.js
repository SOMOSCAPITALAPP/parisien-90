import { currentPlayerProfiles, legendProfiles, newsFeed, psgSchedule2627, seasonSquads } from "./site-data.js";

const params = new URLSearchParams(window.location.search);
const query = params.get("q");

if (query) {
  const marker = document.createElement("p");
  marker.className = "search-result-note";
  marker.textContent = `Recherche : ${query}`;
  document.querySelector("main")?.prepend(marker);
}

const shareChannels = {
  x: ({ title, url }) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
  fb: ({ url }) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  wa: ({ title, url }) => `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} ${url}`)}`,
  tg: ({ title, url }) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  in: ({ url }) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  th: ({ title, url }) => `https://www.threads.net/intent/post?text=${encodeURIComponent(`${title} ${url}`)}`,
  bs: ({ title, url }) => `https://bsky.app/intent/compose?text=${encodeURIComponent(`${title} ${url}`)}`,
  rd: ({ title, url }) => `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
  mail: ({ title, url }) => `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${title}\n${url}`)}`
};

const shareableSelector = [
  ".news-card",
  ".live-item",
  ".story-card",
  ".transfer-card",
  ".source-card",
  ".fixture-item",
  ".match-card",
  ".feed-item",
  "article.topic-card",
  ".timeline > article",
  ".legend-grid > article"
].join(",");

const usedArticleIds = new Set(
  Array.from(document.querySelectorAll("[id]"))
    .map((element) => element.id)
    .filter(Boolean)
);

const slugify = (value) => {
  const slug = String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "article-psg";
};

const escapeHTML = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return map[char];
  });

const normalizeName = (value) => slugify(value).replace(/-/g, "");

const currentProfileMap = new Map(currentPlayerProfiles.map((profile) => [normalizeName(profile.name), profile]));
const legendProfileMap = new Map(legendProfiles.map((profile) => [normalizeName(profile.name), profile]));

const getArticleTitle = (article) => {
  return (
    article.dataset.shareTitle ||
    article.querySelector("h3")?.textContent?.trim() ||
    article.querySelector("h2")?.textContent?.trim() ||
    article.querySelector("strong")?.textContent?.trim() ||
    "Parisien 90"
  );
};

const getShareUrl = (article, title, index) => {
  if (!article.id) {
    const baseId = slugify(title);
    let id = baseId;
    let suffix = 2;

    while (usedArticleIds.has(id)) {
      id = `${baseId}-${suffix}`;
      suffix += 1;
    }

    article.id = id || `article-psg-${index + 1}`;
    usedArticleIds.add(article.id);
  }

  return new URL(article.dataset.shareUrl || `${window.location.pathname}#${article.id}`, window.location.origin).href;
};

const copyToClipboard = async (text) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.left = "-9999px";
  document.body.append(field);
  field.select();
  document.execCommand("copy");
  field.remove();
};

const setShareStatus = (wrapper, message) => {
  const status = wrapper.querySelector(".share-status");
  if (!status) return;

  status.textContent = message;
  window.setTimeout(() => {
    if (status.textContent === message) {
      status.textContent = "";
    }
  }, 1800);
};

const buildShareActions = (article, title, url) => {
  const wrapper = document.createElement("div");
  wrapper.className = "share-actions";
  wrapper.setAttribute("aria-label", `Partager : ${title}`);

  wrapper.innerHTML = `
    <span class="share-label">Partager</span>
    <button class="share-button share-native" type="button" aria-label="Partager cet article avec les apps disponibles">App</button>
    <button class="share-button share-copy" type="button" aria-label="Copier le lien">Copier</button>
    <a class="share-link" data-share-channel="x" target="_blank" rel="noopener noreferrer" aria-label="Partager sur X">X</a>
    <a class="share-link" data-share-channel="fb" target="_blank" rel="noopener noreferrer" aria-label="Partager sur Facebook">FB</a>
    <a class="share-link" data-share-channel="wa" target="_blank" rel="noopener noreferrer" aria-label="Partager sur WhatsApp">WA</a>
    <details class="share-more">
      <summary aria-label="Afficher plus de réseaux">Plus</summary>
      <div class="share-more-panel">
        <a class="share-link" data-share-channel="tg" target="_blank" rel="noopener noreferrer" aria-label="Partager sur Telegram">TG</a>
        <a class="share-link" data-share-channel="in" target="_blank" rel="noopener noreferrer" aria-label="Partager sur LinkedIn">in</a>
        <a class="share-link" data-share-channel="th" target="_blank" rel="noopener noreferrer" aria-label="Partager sur Threads">TH</a>
        <a class="share-link" data-share-channel="bs" target="_blank" rel="noopener noreferrer" aria-label="Partager sur Bluesky">BS</a>
        <a class="share-link" data-share-channel="rd" target="_blank" rel="noopener noreferrer" aria-label="Partager sur Reddit">RD</a>
        <a class="share-link" data-share-channel="mail" aria-label="Partager par e-mail">Mail</a>
      </div>
    </details>
    <span class="share-status" aria-live="polite"></span>
  `;

  wrapper.querySelectorAll("[data-share-channel]").forEach((link) => {
    const channel = link.dataset.shareChannel;
    link.href = shareChannels[channel]({ title, url });
  });

  wrapper.querySelector(".share-copy")?.addEventListener("click", async () => {
    await copyToClipboard(url);
    setShareStatus(wrapper, "Lien copié");
  });

  wrapper.querySelector(".share-native")?.addEventListener("click", async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: title, url });
        return;
      } catch (error) {
        if (error?.name === "AbortError") return;
      }
    }

    await copyToClipboard(url);
    setShareStatus(wrapper, "Lien copié");
  });

  article.append(wrapper);
};

const initShareActions = (root = document) => {
  root.querySelectorAll(shareableSelector).forEach((article, index) => {
    if (article.querySelector(".share-actions")) return;

    const title = getArticleTitle(article);
    const url = getShareUrl(article, title, index);

    buildShareActions(article, title, url);
  });
};

let profileModal;

const getProfileModal = () => {
  if (profileModal) return profileModal;

  profileModal = document.createElement("div");
  profileModal.className = "profile-modal";
  profileModal.hidden = true;
  profileModal.innerHTML = `
    <div class="profile-dialog" role="dialog" aria-modal="true" aria-labelledby="profile-title">
      <button class="profile-close" type="button" aria-label="Fermer la fiche">×</button>
      <span class="profile-kicker" data-profile-kicker></span>
      <h2 id="profile-title"></h2>
      <p data-profile-summary></p>
      <div class="profile-tags" data-profile-tags></div>
      <dl class="profile-facts" data-profile-facts></dl>
      <div class="profile-note" data-profile-note></div>
    </div>
  `;

  const close = () => {
    profileModal.hidden = true;
    document.body.classList.remove("modal-open");
  };

  profileModal.addEventListener("click", (event) => {
    if (event.target === profileModal) close();
  });
  profileModal.querySelector(".profile-close")?.addEventListener("click", close);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !profileModal.hidden) close();
  });

  document.body.append(profileModal);
  return profileModal;
};

const openProfile = (profile) => {
  const modal = getProfileModal();
  const isCurrentPlayer = Boolean(profile.number);
  const tags = [
    profile.number ? `N° ${profile.number}` : null,
    profile.position || profile.role,
    profile.line,
    profile.lifeStatus,
    profile.psgPeriod
  ].filter(Boolean);

  const facts = [
    ["Statut", profile.status || profile.lifeStatus],
    ["Rôle", profile.role],
    ["Poste", profile.position],
    ["Ligne", profile.line],
    ["Période PSG", profile.psgPeriod],
    ["Vie actuelle", profile.currentLife],
    ["À surveiller", profile.watch],
    ["Mise à jour", profile.updatedAt],
    ["Source", profile.source || (isCurrentPlayer ? "PSG.fr" : "Synthèse éditoriale Parisien 90")]
  ].filter(([, value]) => value);

  modal.querySelector("[data-profile-kicker]").textContent = isCurrentPlayer ? "Fiche joueur actuelle" : "Fiche ancien joueur";
  modal.querySelector("#profile-title").textContent = profile.name;
  modal.querySelector("[data-profile-summary]").textContent = profile.profile || profile.whyMatters || "";
  modal.querySelector("[data-profile-tags]").innerHTML = tags.map((tag) => `<span>${escapeHTML(tag)}</span>`).join("");
  modal.querySelector("[data-profile-facts]").innerHTML = facts
    .map(([label, value]) => `<div><dt>${escapeHTML(label)}</dt><dd>${escapeHTML(value)}</dd></div>`)
    .join("");
  modal.querySelector("[data-profile-note]").textContent = profile.whyMatters || "Fiche synthétique, actualisable à partir des sources publiques fiables.";

  modal.hidden = false;
  document.body.classList.add("modal-open");
  window.setTimeout(() => modal.querySelector(".profile-close")?.focus(), 20);
};

const getProfileForName = (name) => currentProfileMap.get(normalizeName(name)) || legendProfileMap.get(normalizeName(name));

const initPlayerProfileEnhancements = () => {
  document.querySelectorAll(".player-list li").forEach((item) => {
    const name = item.querySelector("strong")?.textContent?.trim();
    const profile = name ? currentProfileMap.get(normalizeName(name)) : null;
    if (!profile || item.querySelector(".micro-action")) return;

    const button = document.createElement("button");
    button.className = "micro-action";
    button.type = "button";
    button.textContent = "Fiche";
    button.setAttribute("aria-label", `Ouvrir la fiche de ${profile.name}`);
    button.addEventListener("click", () => openProfile(profile));

    item.classList.add("is-interactive");
    item.querySelector("div")?.append(button);
  });
};

const initLegendProfileChips = () => {
  document.querySelectorAll(".legend-grid article").forEach((card) => {
    if (card.querySelector(".profile-chip-row")) return;

    const title = card.querySelector("h3")?.textContent || "";
    const names = title.split(",").map((name) => name.trim()).filter(Boolean);
    const buttons = names
      .map((name) => getProfileForName(name))
      .filter(Boolean)
      .map((profile) => {
        const button = document.createElement("button");
        button.className = "profile-chip";
        button.type = "button";
        button.textContent = profile.name;
        button.addEventListener("click", () => openProfile(profile));
        return button;
      });

    if (!buttons.length) return;

    const row = document.createElement("div");
    row.className = "profile-chip-row";
    buttons.forEach((button) => row.append(button));
    card.append(row);
  });
};

const monthLabels = {
  "2026-08": "Août 2026",
  "2026-09": "Septembre 2026",
  "2026-10": "Octobre 2026",
  "2026-11": "Novembre 2026",
  "2026-12": "Décembre 2026",
  "2027-01": "Janvier 2027",
  "2027-02": "Février 2027",
  "2027-03": "Mars 2027",
  "2027-04": "Avril 2027",
  "2027-05": "Mai 2027"
};

const createFixtureCard = (fixture) => {
  const article = document.createElement("article");
  article.className = "match-card";
  article.id = `journee-${fixture.round}-${slugify(fixture.opponent)}`;
  article.dataset.shareTitle = `${fixture.home} - ${fixture.away}, journée ${fixture.round} de Ligue 1`;

  const placeClass = fixture.place === "Domicile" ? "is-home" : "is-away";
  article.innerHTML = `
    <div class="match-date">
      <strong>J${fixture.round}</strong>
      <span>${escapeHTML(fixture.dateLabel)}</span>
      <small>${escapeHTML(fixture.day)}</small>
    </div>
    <div class="match-main">
      <div class="item-tags">
        <span>${escapeHTML(fixture.competition)}</span>
        <span class="${placeClass}">${escapeHTML(fixture.place)}</span>
        ${fixture.highlight ? "<span>Affiche</span>" : ""}
      </div>
      <h3>${escapeHTML(fixture.home)} <span>vs</span> ${escapeHTML(fixture.away)}</h3>
      <p>${escapeHTML(fixture.note)} ${escapeHTML(fixture.venue)}.</p>
    </div>
    <div class="match-meta">
      <strong>${escapeHTML(fixture.time)}</strong>
      <span>${escapeHTML(fixture.status)}</span>
    </div>
  `;
  return article;
};

const initCalendarApp = () => {
  const target = document.querySelector("[data-calendar-app]");
  if (!target) return;

  const months = Array.from(new Set(psgSchedule2627.map((fixture) => fixture.month)));
  const homeCount = psgSchedule2627.filter((fixture) => fixture.place === "Domicile").length;
  const highlights = psgSchedule2627.filter((fixture) => fixture.highlight).length;

  target.innerHTML = `
    <div class="calendar-summary" aria-label="Synthèse calendrier PSG">
      <div><span>Matchs Ligue 1</span><strong>${psgSchedule2627.length}</strong></div>
      <div><span>Domicile</span><strong>${homeCount}</strong></div>
      <div><span>Extérieur</span><strong>${psgSchedule2627.length - homeCount}</strong></div>
      <div><span>Affiches</span><strong>${highlights}</strong></div>
    </div>
    <div class="interactive-toolbar">
      <label class="control-field">Recherche
        <input type="search" data-calendar-search placeholder="Adversaire, stade, date" />
      </label>
      <label class="control-field">Mois
        <select data-calendar-month>
          <option value="all">Toute la saison</option>
          ${months.map((month) => `<option value="${month}">${monthLabels[month]}</option>`).join("")}
        </select>
      </label>
      <label class="control-field">Lieu
        <select data-calendar-place>
          <option value="all">Domicile + extérieur</option>
          <option value="Domicile">Domicile</option>
          <option value="Extérieur">Extérieur</option>
        </select>
      </label>
      <label class="control-field">Statut
        <select data-calendar-status>
          <option value="all">Tous les horaires</option>
          <option value="Programmé">Programmés</option>
          <option value="Horaire à confirmer">À confirmer</option>
        </select>
      </label>
    </div>
    <div class="calendar-meta" data-calendar-meta></div>
    <div class="match-list" data-calendar-list></div>
  `;

  const search = target.querySelector("[data-calendar-search]");
  const month = target.querySelector("[data-calendar-month]");
  const place = target.querySelector("[data-calendar-place]");
  const status = target.querySelector("[data-calendar-status]");
  const list = target.querySelector("[data-calendar-list]");
  const meta = target.querySelector("[data-calendar-meta]");

  const render = () => {
    const term = search.value.trim().toLowerCase();
    const filtered = psgSchedule2627.filter((fixture) => {
      const haystack = `${fixture.home} ${fixture.away} ${fixture.opponent} ${fixture.venue} ${fixture.dateLabel}`.toLowerCase();
      return (
        (month.value === "all" || fixture.month === month.value) &&
        (place.value === "all" || fixture.place === place.value) &&
        (status.value === "all" || fixture.status === status.value) &&
        (!term || haystack.includes(term))
      );
    });

    meta.textContent = `${filtered.length} match${filtered.length > 1 ? "s" : ""} affiché${filtered.length > 1 ? "s" : ""}`;
    list.replaceChildren(...filtered.map(createFixtureCard));
    if (!filtered.length) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "Aucun match ne correspond à ce filtre.";
      list.append(empty);
    }
    initShareActions(list);
  };

  [search, month, place, status].forEach((control) => control.addEventListener("input", render));
  render();
};

const initSeasonExplorer = () => {
  const target = document.querySelector("[data-season-explorer]");
  if (!target) return;

  target.innerHTML = `
    <div class="section-heading">
      <div>
        <span class="section-kicker">Archives vivantes</span>
        <h2>Équipes du PSG saison par saison</h2>
      </div>
      <span class="freshness">Base évolutive</span>
    </div>
    <p>La saison 2026-2027 est complète selon l'effectif provisoire officiel. Les saisons historiques sont déjà navigables en groupes repères et conçues pour recevoir une archive exhaustive source par source.</p>
    <div class="interactive-toolbar is-compact">
      <label class="control-field">Saison
        <select data-season-select>
          ${seasonSquads.map((season) => `<option value="${season.id}">${season.label}</option>`).join("")}
        </select>
      </label>
    </div>
    <div data-season-content></div>
  `;

  const select = target.querySelector("[data-season-select]");
  const content = target.querySelector("[data-season-content]");

  const render = () => {
    const season = seasonSquads.find((item) => item.id === select.value) || seasonSquads[0];
    const wrapper = document.createElement("div");
    wrapper.className = "season-squad";
    wrapper.innerHTML = `
      <div class="season-head">
        <div>
          <span>${escapeHTML(season.quality)}</span>
          <h3>${escapeHTML(season.label)}</h3>
        </div>
        <p>${escapeHTML(season.note)}</p>
      </div>
      <div class="season-groups"></div>
    `;

    const groupGrid = wrapper.querySelector(".season-groups");
    season.groups.forEach((group) => {
      const groupCard = document.createElement("article");
      groupCard.className = "season-group";
      groupCard.innerHTML = `<h4>${escapeHTML(group.label)}</h4>`;
      const players = document.createElement("div");
      players.className = "squad-player-list";
      group.players.forEach((name) => {
        const profile = getProfileForName(name);
        const element = document.createElement(profile ? "button" : "span");
        element.className = "squad-player";
        element.textContent = name;
        if (profile) {
          element.type = "button";
          element.addEventListener("click", () => openProfile(profile));
        }
        players.append(element);
      });
      groupCard.append(players);
      groupGrid.append(groupCard);
    });

    content.replaceChildren(wrapper);
  };

  select.addEventListener("change", render);
  render();
};

const initLongNewsFeed = () => {
  const target = document.querySelector("[data-long-news-feed]");
  if (!target) return;

  let activeCategory = "Tous";
  let visibleCount = 10;
  const categories = ["Tous", ...Array.from(new Set(newsFeed.map((item) => item.category)))];

  target.innerHTML = `
    <div class="interactive-toolbar news-toolbar">
      <label class="control-field">Recherche
        <input type="search" data-feed-search placeholder="Digne, calendrier, jeunes..." />
      </label>
      <div class="filter-row" data-feed-categories>
        ${categories.map((category) => `<button class="filter-button${category === "Tous" ? " is-active" : ""}" type="button" data-category="${escapeHTML(category)}">${escapeHTML(category)}</button>`).join("")}
      </div>
    </div>
    <div class="feed-meta" data-feed-meta></div>
    <div class="feed-list" data-feed-list></div>
    <div class="load-more-row"><button class="secondary-load" type="button" data-feed-more>Charger plus</button></div>
  `;

  const search = target.querySelector("[data-feed-search]");
  const list = target.querySelector("[data-feed-list]");
  const meta = target.querySelector("[data-feed-meta]");
  const more = target.querySelector("[data-feed-more]");

  const makeArticle = (item) => {
    const article = document.createElement("article");
    article.className = "feed-item";
    article.id = `news-${item.id}`;
    article.dataset.shareTitle = item.title;
    article.innerHTML = `
      <time>${escapeHTML(item.time)}</time>
      <div class="feed-body">
        <div class="item-tags"><span>${escapeHTML(item.category)}</span><span>${escapeHTML(item.reliability)}</span><span>Viral ${item.viral}</span></div>
        <h3>${escapeHTML(item.title)}</h3>
        <p>${escapeHTML(item.summary)}</p>
        <a href="${escapeHTML(item.url)}" rel="noopener noreferrer">Source : ${escapeHTML(item.source)}</a>
      </div>
    `;
    return article;
  };

  const render = () => {
    const term = search.value.trim().toLowerCase();
    const filtered = newsFeed.filter((item) => {
      const haystack = `${item.title} ${item.summary} ${item.category} ${item.source}`.toLowerCase();
      return (activeCategory === "Tous" || item.category === activeCategory) && (!term || haystack.includes(term));
    });

    const visible = filtered.slice(0, visibleCount);
    list.replaceChildren(...visible.map(makeArticle));
    meta.textContent = `${filtered.length} info${filtered.length > 1 ? "s" : ""} dans le fil, ${visible.length} affichée${visible.length > 1 ? "s" : ""}`;
    more.hidden = visible.length >= filtered.length;
    initShareActions(list);
  };

  target.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category;
      visibleCount = 10;
      target.querySelectorAll("[data-category]").forEach((item) => item.classList.toggle("is-active", item === button));
      render();
    });
  });

  search.addEventListener("input", () => {
    visibleCount = 10;
    render();
  });
  more.addEventListener("click", () => {
    visibleCount += 8;
    render();
  });

  render();
};

const focusHashTarget = () => {
  if (!window.location.hash) return;

  let targetId = window.location.hash.slice(1);

  try {
    targetId = decodeURIComponent(targetId);
  } catch {
    targetId = "";
  }

  const target = document.getElementById(targetId);

  if (target?.matches(shareableSelector)) {
    target.classList.add("is-share-target");
    window.setTimeout(() => target.scrollIntoView({ block: "center" }), 80);
  }
};

initCalendarApp();
initLongNewsFeed();
initPlayerProfileEnhancements();
initLegendProfileChips();
initSeasonExplorer();
initShareActions();
focusHashTarget();
