import { newsFeed, newsMeta } from "../src/site-data.js";

const SITE_URL = "https://parisien90.com";

const isPublishedNews = (item) =>
  !String(item.reliability || "").toLowerCase().includes("archive") &&
  !String(item.title || "").toLowerCase().startsWith("édition du");

const normalizeUrl = (url) => new URL(url, SITE_URL).href;

const classify = ({ status, redirected, error }) => {
  if (error) return "SOURCE_A_VERIFIER";
  if (status >= 200 && status < 300 && redirected) return "REDIRECTION";
  if (status >= 200 && status < 300) return "OK";
  if (status >= 300 && status < 400) return "REDIRECTION";
  return "SOURCE_A_VERIFIER";
};

const checkSource = async (item) => {
  const url = normalizeUrl(item.url);
  const startedAt = Date.now();

  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(12000),
      headers: {
        "user-agent": "Parisien90SourceAudit/1.0 (+https://parisien90.com/sources-psg/)"
      }
    });

    return {
      id: item.id,
      title: item.title,
      category: item.category,
      source: item.source,
      sourceUrl: url,
      status: response.status,
      finalUrl: response.url,
      latencyMs: Date.now() - startedAt,
      state: classify({ status: response.status, redirected: response.url !== url })
    };
  } catch (error) {
    return {
      id: item.id,
      title: item.title,
      category: item.category,
      source: item.source,
      sourceUrl: url,
      status: null,
      finalUrl: null,
      latencyMs: Date.now() - startedAt,
      state: classify({ error: error?.name || error?.message || "FETCH_ERROR" }),
      error: error?.name || error?.message || "FETCH_ERROR"
    };
  }
};

const uniqueSourceItems = () => {
  const byUrl = new Map();
  newsFeed.filter(isPublishedNews).forEach((item) => {
    const url = normalizeUrl(item.url);
    if (!byUrl.has(url)) byUrl.set(url, item);
  });
  return Array.from(byUrl.values());
};

export default async function handler(request, response) {
  const requestUrl = new URL(request.url || "/", SITE_URL);
  const isPublicView = requestUrl.searchParams.get("public") === "1";
  const secret = process.env.CRON_SECRET;

  if (!isPublicView && (!secret || request.headers.authorization !== `Bearer ${secret}`)) {
    response.status(401).json({ ok: false, error: "Unauthorized" });
    return;
  }

  const limit = Math.min(Number(requestUrl.searchParams.get("limit") || (isPublicView ? 40 : 120)), isPublicView ? 60 : 160);
  const sources = uniqueSourceItems().slice(0, limit);
  const results = [];

  for (let index = 0; index < sources.length; index += 6) {
    const slice = sources.slice(index, index + 6);
    results.push(...(await Promise.all(slice.map(checkSource))));
  }

  const summary = results.reduce(
    (acc, item) => {
      acc[item.state] = (acc[item.state] || 0) + 1;
      return acc;
    },
    { OK: 0, REDIRECTION: 0, SOURCE_A_VERIFIER: 0 }
  );

  response.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=3600");
  response.status(200).json({
    ok: true,
    checkedAt: new Date().toISOString(),
    editorialUpdatedAt: newsMeta.updatedAt,
    count: results.length,
    summary,
    results
  });
}
