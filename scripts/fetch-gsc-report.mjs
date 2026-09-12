import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, "..");
const OUTPUT_FILE = path.join(ROOT_DIR, "public", "seo-gsc-report.json");

const TARGET_QUERIES = [
  "transfert psg",
  "psg transfert",
  "psg mercato",
  "mercato psg",
  "calendrier psg",
  "ronaldinho psg",
  "transferencias psg",
  "mercado psg",
  "calendario psg"
];

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GSC_API_BASE = "https://searchconsole.googleapis.com";
const SITE_URL = process.env.GSC_SITE_URL || "https://parisien90.com/";

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
  const header = { alg: "RS256", typ: "JWT" };
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
    throw new Error("Missing GSC service account credentials (GSC_SERVICE_ACCOUNT_JSON or GSC_SERVICE_ACCOUNT_EMAIL/GSC_PRIVATE_KEY).");
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
    throw new Error(`OAuth failure: ${response.status} ${message}`);
  }

  const payload = await response.json();
  if (!payload.access_token) {
    throw new Error("OAuth response does not contain access_token.");
  }
  return payload.access_token;
};

const queryGsc = async (accessToken, startDate, endDate) => {
  const encodedSite = encodeURIComponent(SITE_URL);
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
    throw new Error(`GSC query failure: ${response.status} ${message}`);
  }

  return response.json();
};

const normalizeQuery = (text) =>
  text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const summarizeTargets = (rows) => {
  const result = new Map(
    TARGET_QUERIES.map((query) => [query, { query, impressions: 0, clicks: 0, position: null, ctr: 0, page: null }])
  );

  rows.forEach((row) => {
    const [query, page] = row.keys || [];
    if (!query || !page) return;
    const normalized = normalizeQuery(query);

    for (const [target] of result) {
      const needle = normalizeQuery(target);
      if (!normalized.includes(needle) && !needle.includes(normalized)) continue;

      const bucket = result.get(target);
      const impressions = Number(row.impressions || 0);
      const clicks = Number(row.clicks || 0);
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      if (impressions > bucket.impressions) {
        bucket.impressions = impressions;
        bucket.clicks = clicks;
        bucket.ctr = Number.isFinite(ctr) ? Number(ctr.toFixed(2)) : 0;
        bucket.position = Number(row.position || 0);
        bucket.page = page;
      }
    }
  });

  return Array.from(result.values())
    .sort((a, b) => b.impressions - a.impressions);
};

const topPages = (rows) => {
  const hubs = [
    "/transfert-psg/",
    "/mercato-psg/",
    "/calendrier-psg/",
    "/joueurs-psg/",
    "/records-psg/",
    "/dossiers-psg/",
    "/histoire-psg/",
    "/br/mercado-psg/",
    "/br/transferencias-psg/",
    "/br/noticias-psg/",
    "/br/jogadores-psg/",
    "/br/dossies-psg/"
  ];

  return hubs.map((path) => {
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
  });
};

const main = async () => {
  const now = new Date();
  const end = now.toISOString().slice(0, 10);
  const start = new Date(now);
  start.setDate(start.getDate() - 28);

  const accessToken = await getAccessToken();
  const data = await queryGsc(accessToken, start.toISOString().slice(0, 10), end);
  const rows = data.rows || [];

  const payload = {
    fetchedAt: new Date().toISOString(),
    source: "search-console",
    window: {
      startDate: start.toISOString().slice(0, 10),
      endDate: end
    },
    targets: summarizeTargets(rows),
    topPages: topPages(rows),
    sampledRows: rows.length
  };

  await fs.promises.writeFile(OUTPUT_FILE, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`GSC report saved to ${OUTPUT_FILE}`);
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
