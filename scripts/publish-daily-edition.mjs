import { readFile, writeFile } from "node:fs/promises";
import { currentPlayerProfiles, newsFeed, psgSchedule2627 } from "../src/site-data.js";

const ROOT = new URL("../", import.meta.url);
const NEWS_FILE = new URL("../src/generated-daily-news.js", import.meta.url);
const BR_FILE = new URL("../src/generated-br-story-translations.js", import.meta.url);
const OFFICIAL_CALENDAR = "https://www.psg.fr/football-masculin/calendrier/season/2026-27";
const MAX_ARCHIVE_DAYS = 14;
const REQUIRED_BEATS = ["joueur", "prochain-match", "dernier-match", "ligue-1", "ligue-des-champions", "tactique"];

const now = process.env.EDITORIAL_NOW ? new Date(process.env.EDITORIAL_NOW) : new Date();
if (Number.isNaN(now.getTime())) throw new Error("EDITORIAL_NOW must be a valid ISO date.");

const parisParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Paris",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23"
})
  .formatToParts(now)
  .reduce((parts, part) => ({ ...parts, [part.type]: part.value }), {});
const parisDate = `${parisParts.year}-${parisParts.month}-${parisParts.day}`;
const parisTime = `${parisParts.hour}:${parisParts.minute}`;
const displayDate = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  day: "numeric",
  month: "long",
  year: "numeric"
}).format(now);

const isForced = process.argv.includes("--force") || process.env.DAILY_EDITION_FORCE === "true";
const isDryRun = process.argv.includes("--dry-run");
const publishingWindow = (parisTime === "06:30" || parisTime === "12:00") && REQUIRED_BEATS.length === 6;

if (!isForced && !publishingWindow) {
  console.log(`Daily publication skipped outside the Paris publishing windows (${parisTime}).`);
  process.exit(0);
}

const dateDistance = (from, to) => Math.floor((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
const officialSource = (fixture) => fixture?.sourceUrl || OFFICIAL_CALENDAR;
const fixtureLabel = (fixture) => `${fixture.home}-${fixture.away}`;
const sourceName = (fixture) => fixture?.source || "PSG.fr";
const isFinished = (fixture) => /^Termin[ée]/i.test(String(fixture.status || ""));

const lastMatch = psgSchedule2627
  .filter((fixture) => fixture.isoDate <= parisDate && isFinished(fixture))
  .sort((a, b) => b.isoDate.localeCompare(a.isoDate))[0];
const nextMatch = psgSchedule2627
  .filter((fixture) => fixture.isoDate >= parisDate && !isFinished(fixture))
  .sort((a, b) => a.isoDate.localeCompare(b.isoDate))[0];
const nextLigue1 = psgSchedule2627
  .filter((fixture) => fixture.competition === "Ligue 1" && fixture.isoDate >= parisDate && !isFinished(fixture))
  .sort((a, b) => a.isoDate.localeCompare(b.isoDate))[0];
const nextChampions = psgSchedule2627
  .filter((fixture) => fixture.competition === "Ligue des champions" && fixture.isoDate >= parisDate && !isFinished(fixture))
  .sort((a, b) => a.isoDate.localeCompare(b.isoDate))[0];

if (!lastMatch || dateDistance(lastMatch.isoDate, parisDate) > 3) {
  throw new Error("No verified completed PSG match is recent enough to publish the daily last-match article.");
}
if (!nextMatch || dateDistance(parisDate, nextMatch.isoDate) > 14 || !nextLigue1 || !nextChampions) {
  throw new Error("The official schedule does not provide the next PSG, Ligue 1 and Champions League fixtures required for publication.");
}

const player = currentPlayerProfiles[Math.floor(Date.parse(`${parisDate}T00:00:00Z`) / 86_400_000) % currentPlayerProfiles.length];
const slug = (value) =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const item = ({ beat, category, title, summary, source, url, reliability = "Analyse Parisien 90 — source officielle", viral = 70 }) => ({
  id: `edition-${parisDate}-${beat}`,
  date: parisDate,
  dateLabel: displayDate,
  time: parisTime,
  category,
  title,
  summary,
  source,
  url,
  reliability,
  viral
});

const edition = [
  item({
    beat: "joueur",
    category: "Joueurs PSG",
    title: `${player.name} au PSG : le rôle à surveiller avant ${fixtureLabel(nextMatch)}`,
    summary: `${player.name} reste un repère de l'effectif parisien par son profil de ${player.role.toLowerCase()}. À l'approche de ${fixtureLabel(nextMatch)}, l'enjeu n'est pas de lui prêter une information non confirmée : il s'agit de lire sa place dans la rotation, ses complémentarités et ce que son utilisation peut révéler du plan de Luis Enrique.`,
    source: "PSG.fr - effectif masculin",
    url: "https://www.psg.fr/equipes/equipe-premiere/effectif"
  }),
  item({
    beat: "prochain-match",
    category: "Match",
    title: `${fixtureLabel(nextMatch)} : date, heure et les trois questions avant le prochain match du PSG`,
    summary: `Le prochain rendez-vous du PSG est programmé le ${nextMatch.dateLabel} à ${nextMatch.time}, ${nextMatch.place.toLowerCase()}, en ${nextMatch.competition}. Avant le coup d'envoi, Parisien 90 sépare les faits déjà confirmés de l'analyse : disponibilité du groupe, gestion de la rotation et scénario tactique attendu autour de ${nextMatch.opponent}.`,
    source: sourceName(nextMatch),
    url: officialSource(nextMatch),
    reliability: "Officiel — calendrier"
  }),
  item({
    beat: "dernier-match",
    category: "Match",
    title: `${fixtureLabel(lastMatch)} : ce que le dernier match du PSG a vraiment laissé`,
    summary: `Le dernier match officiellement renseigné du PSG reste ${fixtureLabel(lastMatch)}, le ${lastMatch.dateLabel}. ${lastMatch.note} Cette lecture revient sur les faits du rendez-vous et sur les conséquences concrètes pour le groupe, sans transformer un résultat ou une séquence en conclusion définitive pour la saison.`,
    source: sourceName(lastMatch),
    url: officialSource(lastMatch),
    reliability: "Officiel — résultat"
  }),
  item({
    beat: "ligue-1",
    category: "Ligue 1",
    title: `PSG en Ligue 1 : pourquoi ${fixtureLabel(nextLigue1)} pèse déjà dans la course`,
    summary: `Le prochain repère du PSG en Ligue 1 est ${fixtureLabel(nextLigue1)}, programmé le ${nextLigue1.dateLabel} à ${nextLigue1.time}. Cette étape du championnat compte autant pour les points que pour la gestion des séquences : calendrier, fraîcheur des cadres et capacité à imposer le rythme avant les grandes échéances européennes.`,
    source: sourceName(nextLigue1),
    url: officialSource(nextLigue1),
    reliability: "Officiel — calendrier Ligue 1"
  }),
  item({
    beat: "ligue-des-champions",
    category: "Ligue des champions",
    title: `PSG en Ligue des champions : ce que prépare ${fixtureLabel(nextChampions)}`,
    summary: `${fixtureLabel(nextChampions)} est programmé le ${nextChampions.dateLabel} à ${nextChampions.time}, en ${nextChampions.place.toLowerCase()}. La Ligue des champions change l'échelle de chaque détail : disponibilité, maîtrise du ballon, gestion des temps faibles et capacité du PSG à conserver son identité face à une opposition de très haut niveau.`,
    source: sourceName(nextChampions),
    url: officialSource(nextChampions),
    reliability: "Officiel — calendrier européen"
  }),
  item({
    beat: "tactique",
    category: "Tactique PSG",
    title: `Tactique PSG : du dernier match à ${fixtureLabel(nextMatch)}, le détail qui peut tout changer`,
    summary: `Entre ${fixtureLabel(lastMatch)} et ${fixtureLabel(nextMatch)}, le PSG doit surtout maîtriser les transitions et la répartition des efforts. Cette analyse distingue les éléments observables du dernier rendez-vous, le contexte du prochain adversaire et les choix de rotation possibles, sans présenter une composition ou une consigne interne comme acquise avant les annonces officielles.`,
    source: `${sourceName(lastMatch)} / ${sourceName(nextMatch)}`,
    url: officialSource(nextMatch),
    reliability: "Analyse Parisien 90 — calendrier officiel"
  })
];

if (new Set(edition.map((entry) => entry.id)).size !== REQUIRED_BEATS.length) throw new Error("Daily edition must contain six unique beats.");
if (!edition.every((entry) => entry.title.length >= 30 && entry.summary.length >= 180 && /^https:\/\//.test(entry.url))) {
  throw new Error("Daily edition did not meet publication quality requirements.");
}

const existingModule = await readFile(NEWS_FILE, "utf8");
const existingJson = existingModule.match(/export const generatedDailyNews = ([\s\S]*);\s*$/);
const existingNews = existingJson ? JSON.parse(existingJson[1]) : [];
const cutoff = new Date(`${parisDate}T00:00:00Z`);
cutoff.setUTCDate(cutoff.getUTCDate() - MAX_ARCHIVE_DAYS);
const retained = existingNews.filter((entry) => Date.parse(`${entry.date}T00:00:00Z`) >= cutoff.getTime() && entry.date !== parisDate);
const nextNews = [...edition, ...retained];
const meta = {
  updatedAt: now.toISOString(),
  edition: `Édition PSG du ${displayDate}`,
  displayDate,
  displayTime: `${parisParts.hour}h${parisParts.minute}`,
  rightsNote: "Synthèses originales Parisien 90. Les sources sont citées et liées ; aucun article tiers n'est reproduit."
};
const brTranslation = {
  id: edition[5].id,
  title: `Tática do PSG: o detalhe entre o último jogo e ${fixtureLabel(nextMatch)}`,
  summary: `Entre o último compromisso confirmado e ${fixtureLabel(nextMatch)}, o PSG precisa controlar transições, rodagem e intensidade. A análise separa fatos confirmados, contexto do calendário e leitura tática, sem antecipar escalações antes das comunicações oficiais.`
};

if (isDryRun) {
  console.log(`Dry run: ${edition.length} source-backed articles ready for ${parisDate}; pt-BR article: ${brTranslation.id}.`);
  process.exit(0);
}

await writeFile(NEWS_FILE, `// Generated by scripts/publish-daily-edition.mjs. Do not edit manually.\nexport const generatedDailyNewsMeta = ${JSON.stringify(meta, null, 2)};\n\nexport const generatedDailyNews = ${JSON.stringify(nextNews, null, 2)};\n`, "utf8");
await writeFile(BR_FILE, `// Generated by scripts/publish-daily-edition.mjs. Do not edit manually.\nexport const generatedBrStoryTranslations = ${JSON.stringify([brTranslation], null, 2)};\n`, "utf8");
console.log(`Daily edition created: ${edition.length} articles for ${parisDate}, including one pt-BR article.`);
