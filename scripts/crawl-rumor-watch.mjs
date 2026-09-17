import { readFile, writeFile } from "node:fs/promises";

const ROOT = new URL("../", import.meta.url);
const SOURCES_FILE = new URL("data/rumor-watch-sources.json", ROOT);
const OUTPUT_FILE = new URL("public/rumor-watch-report.json", ROOT);

const sourceConfig = JSON.parse(await readFile(SOURCES_FILE, "utf8"));

const canFetch = (source) => source.crawlMode === "public-page";

const extractTitle = (html) => {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!titleMatch) return null;
  return titleMatch[1].replace(/\s+/g, " ").trim();
};

const checkSource = async (source) => {
  const startedAt = Date.now();

  if (!canFetch(source)) {
    return {
      name: source.name,
      url: source.url,
      type: source.type,
      priority: source.priority,
      crawlMode: source.crawlMode,
      state: "MANUAL_OR_API_ONLY",
      note: source.notes
    };
  }

  try {
    const response = await fetch(source.url, {
      redirect: "follow",
      signal: AbortSignal.timeout(12000),
      headers: {
        "user-agent": "Parisien90RumorWatch/1.0 (+https://parisien90.com/sources-psg/)"
      }
    });
    const html = await response.text();

    return {
      name: source.name,
      url: source.url,
      finalUrl: response.url,
      type: source.type,
      priority: source.priority,
      status: response.status,
      state: response.ok ? "OK" : "SOURCE_A_VERIFIER",
      pageTitle: extractTitle(html),
      latencyMs: Date.now() - startedAt,
      note: source.notes
    };
  } catch (error) {
    return {
      name: source.name,
      url: source.url,
      type: source.type,
      priority: source.priority,
      state: "SOURCE_A_VERIFIER",
      error: error?.name || error?.message || "FETCH_ERROR",
      latencyMs: Date.now() - startedAt,
      note: source.notes
    };
  }
};

const results = [];
for (let index = 0; index < sourceConfig.sources.length; index += 4) {
  const slice = sourceConfig.sources.slice(index, index + 4);
  results.push(...(await Promise.all(slice.map(checkSource))));
}

const summary = results.reduce((acc, item) => {
  acc[item.state] = (acc[item.state] || 0) + 1;
  return acc;
}, {});

const report = {
  ok: true,
  checkedAt: new Date().toISOString(),
  policy: sourceConfig.policy,
  summary,
  results
};

await writeFile(OUTPUT_FILE, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(`Rumor watch complete: ${results.length} sources checked.`);
