const CHANNELS = {
  "immigre-parisien": {
    id: "UCzSSwnU5MohO6vQqmMjKUyw",
    name: "L'Immigré Parisien"
  }
};

const LIVE_TITLE_PATTERN = /\b(live|direct|comment[ée]|\u{1f534})\b/iu;

const decodeXml = (value = "") =>
  value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");

const getTag = (entry, tag) => {
  const match = entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return decodeXml(match?.[1]?.trim() || "");
};

const getVideoId = (entry) => {
  const ytId = getTag(entry, "yt:videoId");
  if (ytId) return ytId;

  const link = entry.match(/<link[^>]+href="([^"]+)"/i)?.[1];
  return new URL(link || "https://www.youtube.com/watch?v=").searchParams.get("v") || "";
};

const formatDate = (isoDate) =>
  new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Paris"
  }).format(new Date(isoDate));

export default async function handler(request, response) {
  const requestUrl = new URL(request.url || "/", "https://parisien90.com");
  const channelKey = requestUrl.searchParams.get("channel") || "";
  const type = requestUrl.searchParams.get("type") || "latest";
  const channel = CHANNELS[channelKey];

  if (!channel) {
    response.status(400).json({ ok: false, error: "Unknown channel" });
    return;
  }

  try {
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channel.id)}`;
    const feedResponse = await fetch(feedUrl, {
      headers: {
        "user-agent": "Parisien90YouTubeLatest/1.0 (+https://parisien90.com/videos-psg/)"
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!feedResponse.ok) {
      response.status(502).json({ ok: false, error: "YouTube feed unavailable" });
      return;
    }

    const xml = await feedResponse.text();
    const entries = Array.from(xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)).map((match) => match[1]);
    const selected =
      type === "live"
        ? entries.find((entry) => LIVE_TITLE_PATTERN.test(getTag(entry, "title"))) || entries[0]
        : entries[0];

    if (!selected) {
      response.status(404).json({ ok: false, error: "No video found" });
      return;
    }

    const publishedAt = getTag(selected, "published");
    const videoId = getVideoId(selected);

    response.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=7200");
    response.status(200).json({
      ok: true,
      channel: channel.name,
      videoId,
      title: getTag(selected, "title"),
      publishedAt,
      publishedLabel: publishedAt ? formatDate(publishedAt) : "date YouTube non disponible",
      url: `https://www.youtube.com/watch?v=${videoId}`
    });
  } catch (error) {
    response.status(500).json({ ok: false, error: error?.name || "FetchError" });
  }
}
