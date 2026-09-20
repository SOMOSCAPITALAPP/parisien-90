import { readFile, writeFile } from "node:fs/promises";

const ROOT = new URL("../", import.meta.url);
const TEAM_FILE = new URL("data/editorial-team.json", ROOT);
const RUMOR_SOURCES_FILE = new URL("data/rumor-watch-sources.json", ROOT);
const OUTPUT_FILE = new URL("data/daily-editorial-plan.json", ROOT);

const team = JSON.parse(await readFile(TEAM_FILE, "utf8"));
const rumorSources = JSON.parse(await readFile(RUMOR_SOURCES_FILE, "utf8"));

const now = new Date();
const parisDate = new Intl.DateTimeFormat("fr-CA", {
  timeZone: "Europe/Paris",
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
}).format(now);
const dayIndex = Math.floor(now.getTime() / 86400000) % team.dailyRotation.length;
const todayDeskIds = team.dailyRotation[dayIndex];
const journalists = new Map(team.journalists.map((journalist) => [journalist.id, journalist]));
const highPrioritySources = rumorSources.sources
  .filter((source) => source.priority === "high")
  .map((source) => ({ name: source.name, url: source.url, crawlMode: source.crawlMode }));

const assignments = todayDeskIds.map((id, index) => {
  const journalist = journalists.get(id);
  const primaryQuery = journalist.priorityQueries[index % journalist.priorityQueries.length];
  const articleType = journalist.articleTypes[index % journalist.articleTypes.length];

  return {
    order: index + 1,
    journalistId: journalist.id,
    journalistName: journalist.name,
    beat: journalist.beat,
    articleType,
    targetQuery: primaryQuery,
    requiredOutput: {
      format: "article long original",
      minWords: 900,
      mustInclude: [
        "titre partageable",
        "chapô clair",
        "date et heure Europe/Paris",
        "sources citées et liées",
        "distinction fait/analyse/opinion",
        "liens internes vers pages piliers"
      ]
    },
    safeguards: team.legalPolicy
  };
});

const plan = {
  ok: true,
  generatedAt: now.toISOString(),
  editorialDate: parisDate,
  dailyMinimumArticles: team.dailyMinimumArticles,
  status: "ready_for_editorial_run",
  publicReminder: "Ne pas publier de mention de strategie SEO, d'automatisation ou de fonctionnement interne.",
  languages: team.languagePolicy,
  sourceWatch: {
    highPrioritySources,
    socialPolicy: "Reseaux sociaux uniquement via API officielle, embed autorise, lien direct ou validation manuelle."
  },
  assignments
};

await writeFile(OUTPUT_FILE, `${JSON.stringify(plan, null, 2)}\n`, "utf8");
console.log(`Daily editorial plan ready: ${assignments.length} assignments for ${parisDate}.`);
