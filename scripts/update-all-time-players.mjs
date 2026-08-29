import { writeFile } from "node:fs/promises";

const endpoint = "https://query.wikidata.org/sparql";
const outputPath = new URL("../src/all-time-psg-players.js", import.meta.url);

const query = `
SELECT ?player ?playerLabel
       (GROUP_CONCAT(DISTINCT ?positionLabel; separator=", ") AS ?positions)
       (GROUP_CONCAT(DISTINCT ?countryLabel; separator=", ") AS ?countries)
       (MIN(?start) AS ?firstStart)
       (MAX(?end) AS ?lastEnd)
WHERE {
  ?player wdt:P54 wd:Q483020 .
  OPTIONAL {
    ?player wdt:P413 ?position .
    ?position rdfs:label ?positionLabel .
    FILTER(LANG(?positionLabel) IN ("fr", "en"))
  }
  OPTIONAL {
    ?player wdt:P27 ?country .
    ?country rdfs:label ?countryLabel .
    FILTER(LANG(?countryLabel) = "fr")
  }
  OPTIONAL {
    ?player p:P54 ?st .
    ?st ps:P54 wd:Q483020 .
    OPTIONAL { ?st pq:P580 ?start }
    OPTIONAL { ?st pq:P582 ?end }
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "fr,en". }
}
GROUP BY ?player ?playerLabel
ORDER BY ?playerLabel
`;

const slugify = (value) => {
  const slug = String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "joueur-psg";
};

const year = (value) => {
  if (!value) return "";
  const match = String(value).match(/\d{4}/);
  return match ? match[0] : "";
};

const period = (start, end) => {
  const startYear = year(start);
  const endYear = year(end);
  if (startYear && endYear && startYear !== endYear) return `${startYear}-${endYear}`;
  if (startYear && !endYear) return `${startYear}-`;
  if (startYear) return startYear;
  return "Période à vérifier";
};

const positionGroup = (positions) => {
  const value = String(positions || "").toLowerCase();
  if (!value) return "Poste à vérifier";
  if (value.includes("goalkeeper") || value.includes("gardien")) return "Gardien";
  if (
    value.includes("defender") ||
    value.includes("défenseur") ||
    value.includes("arrière") ||
    value.includes("centre-back") ||
    value.includes("full-back")
  ) return "Défenseur";
  if (
    value.includes("forward") ||
    value.includes("striker") ||
    value.includes("winger") ||
    value.includes("attaquant") ||
    value.includes("ailier")
  ) return "Attaquant";
  if (value.includes("midfield") || value.includes("milieu")) return "Milieu";
  return "Joueur de champ";
};

const response = await fetch(`${endpoint}?query=${encodeURIComponent(query)}&format=json`, {
  headers: {
    Accept: "application/sparql-results+json",
    "User-Agent": "Parisien90/1.0"
  }
});

if (!response.ok) {
  throw new Error(`Wikidata query failed: ${response.status} ${response.statusText}`);
}

const payload = await response.json();
const bindings = payload.results.bindings;
const players = bindings
  .map((item) => ({
    id: slugify(item.playerLabel.value),
    name: item.playerLabel.value,
    period: period(item.firstStart?.value, item.lastEnd?.value),
    positionGroup: positionGroup(item.positions?.value),
    countries: item.countries?.value || "Nationalité à vérifier",
    source: item.player.value
  }))
  .filter((item) => item.name && !item.name.startsWith("Q"));

const seen = new Set();
const deduped = players.filter((item) => {
  const key = `${item.name}|${item.source}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

const generated = `// Generated from Wikidata Query Service, CC0 data, on 2026-08-29.
// Run: node scripts/update-all-time-players.mjs
export const allTimePsgPlayersMeta = {
  sourceName: "Wikidata Query Service",
  sourceUrl: "https://query.wikidata.org/",
  sourceLicense: "CC0",
  generatedAt: "2026-08-29",
  count: ${deduped.length},
  note: "Base ouverte des personnes associées au Paris Saint-Germain via Wikidata P54. À croiser progressivement avec les archives de matchs officiels pour les apparitions exactes."
};

export const allTimePsgPlayers = ${JSON.stringify(deduped, null, 2)};
`;

await writeFile(outputPath, `${generated}\n`, "utf8");
console.log(`Generated ${deduped.length} PSG player entries in ${outputPath.pathname}`);
