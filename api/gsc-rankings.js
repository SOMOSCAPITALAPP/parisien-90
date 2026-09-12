const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GSC_API_BASE = "https://searchconsole.googleapis.com";
const SITE_URL = process.env.GSC_SITE_URL || "https://parisien90.com/";

const TARGET_QUERIES = [
  "transfert psg",
  "psg transfert",
  "psg mercato",
  "mercato psg",
  "calendrier psg",
  "ronaldinho psg",
  "transferencias psg",
  "mercado psg",
  "calendario psg",
  "ronaldinho paris saint germain"
];

const encodeBase64Url = (value) =>
  Buffer.from(typeof value === "string" ? value : JSON.stringify(value))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/u, "");

const getServiceAccountCredentials = () => {
  if (process.env.GSC_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.GSC_SERVICE_ACCOUNT_JSON);
  }

  if (process.env.GSC_SERVICE_ACCOUNT_EMAIL && process.env.GSC_PRIVATE_KEY) {
    return {
      client_email: process.env.GSC_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GSC_PRIVATE_KEY.replace(/\\n/g, "\n")
    };
  }

  return null;
};

const buildJwt = async (credentials) => {
  const { createSign } = await import("node:crypto");
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "RS256",
    typ: "JWT"
  };
  const payload = {
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/webmasters",
    aud: GOOGLE_TOKEN_URL,
    exp: now + 3600,
    iat: now
  };
  const token = `${encodeBase64Url(header)}.${encodeBase64Url(payload)}`;
  const signer = createSign("RSA-SHA256");
  signer.update(token);
  const signature = signer.sign({ key: credentials.private_key });
  const signed = signature
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/u, "");
  return `${token}.${signed}`;
};

const getAccessToken = async () => {
  const credentials = getServiceAccountCredentials();
  if (!credentials) {
    throw new Error("missing-service-account");
  }

  const jwt = await buildJwt(credentials);
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`oauth-failed:${response.status}:${message}`);
  }

  const payload = await response.json();
  if (!payload.access_token) {
    throw new Error("missing-access-token");
  }

  return payload.access_token;
};

const queryGsc = async (accessToken, site, startDate, endDate) => {
  const encodedSite = encodeURIComponent(site);
  const response = await fetch(
    `${GSC_API_BASE}/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions: ["query", "page"],
        rowLimit: 1200,
        searchType: "web",
        dataState: "all"
      })
    }
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`gsc-query-failed:${response.status}:${message}`);
  }

  return response.json();
};

const normalizeQuery = (text) =>
  text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const scoreTargets = (rows, targetQueries) => {
  const best = new Map(
    targetQueries.map((query) => [query, { query, impressions: 0, clicks: 0, ctr: 0, position: null, page: null }])
  );

  rows.forEach((row) => {
    const [query, page] = row.keys || [];
    if (!query || !page) return;
    const normalized = normalizeQuery(query);

    targetQueries.forEach((target) => {
      const needle = normalizeQuery(target);
      if (!normalized.includes(needle) && !needle.includes(normalized)) return;
      const bucket = best.get(target);
      const impressions = Number(row.impressions || 0);
      const clicks = Number(row.clicks || 0);
      const position = Number(row.position || 0);
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

      if (impressions === 0) return;
      if (!bucket.page || impressions > bucket.impressions) {
        bucket.impressions = impressions;
        bucket.clicks = clicks;
        bucket.position = Number.isFinite(position) ? Number(position.toFixed(2)) : null;
        bucket.ctr = Number.isFinite(ctr) ? Number(ctr.toFixed(2)) : 0;
        bucket.page = page;
      }
    });
  });

  return Array.from(best.values())
    .sort((a, b) => b.impressions - a.impressions);
};

const summarizePages = (rows) => {
  const hubs = [
    "/transfert-psg/",
    "/mercato-psg/",
    "/calendrier-psg/",
    "/joueurs-psg/",
    "/records-psg/",
    "/dossiers-psg/",
    "/histoire-psg/",
    "/br/mercado-psg/",
    "/br/jogadores-psg/",
    "/br/noticias-psg/",
    "/br/dossies-psg/"
  ];

  return hubs
    .map((path) => {
      const stats = rows.reduce(
        (acc, row) => {
          if ((row.keys?.[1] || "").includes(path)) {
            acc.impressions += Number(row.impressions || 0);
            acc.clicks += Number(row.clicks || 0);
          }
          return acc;
        },
        { impressions: 0, clicks: 0 }
      );
      const ctr = stats.impressions > 0 ? (stats.clicks / stats.impressions) * 100 : 0;
      return {
        path,
        impressions: stats.impressions,
        clicks: stats.clicks,
        ctr: Number.isFinite(ctr) ? Number(ctr.toFixed(2)) : 0
      };
    })
    .sort((a, b) => b.impressions - a.impressions);
};

export default async function handler(request, response) {
  const requestUrl = new URL(request.url || "/", SITE_URL);
  const isPublic = requestUrl.searchParams.get("public") === "1";
  const hasSecret = request.headers.authorization === `Bearer ${process.env.CRON_SECRET}`;

  if (!isPublic && !hasSecret) {
    response.status(401).json({ ok: false, error: "Unauthorized" });
    return;
  }

  const now = new Date();
  const endDate = now.toISOString().slice(0, 10);
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - 28);

  try {
    const accessToken = await getAccessToken();
    const data = await queryGsc(
      accessToken,
      SITE_URL,
      startDate.toISOString().slice(0, 10),
      endDate
    );

    const rows = data.rows || [];
    response.status(200).json({
      ok: true,
      fetchedAt: new Date().toISOString(),
      window: {
        startDate: startDate.toISOString().slice(0, 10),
        endDate,
        queryCount: TARGET_QUERIES.length
      },
      targets: scoreTargets(rows, TARGET_QUERIES),
      topPages: summarizePages(rows),
      sampledRows: rows.length
    });
  } catch (error) {
    response.status(200).json({
      ok: false,
      fetchedAt: new Date().toISOString(),
      error: String(error.message || error)
    });
  }
}
