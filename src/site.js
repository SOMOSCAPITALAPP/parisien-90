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
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "article-psg";
};

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

document.querySelectorAll(shareableSelector).forEach((article, index) => {
  if (article.querySelector(".share-actions")) return;

  const title = getArticleTitle(article);
  const url = getShareUrl(article, title, index);

  buildShareActions(article, title, url);
});

if (window.location.hash) {
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
}
