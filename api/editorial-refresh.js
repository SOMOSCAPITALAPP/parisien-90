const SITE_URL = process.env.PUBLIC_SITE_URL || "https://parisien90.com";

const isParisEditorialRun = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);
  const time = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${time.hour}:${time.minute}` === "06:30" || `${time.hour}:${time.minute}` === "12:00";
};

export default async function handler(request, response) {
  const secret = process.env.CRON_SECRET;

  if (!secret || request.headers.authorization !== `Bearer ${secret}`) {
    response.status(401).json({ ok: false, error: "Unauthorized" });
    return;
  }

  if (!isParisEditorialRun()) {
    response.status(204).end();
    return;
  }

  const headers = { authorization: `Bearer ${secret}` };
  const [rankings, sources] = await Promise.all([
    fetch(`${SITE_URL}/api/gsc-rankings?public=1`, { headers }),
    fetch(`${SITE_URL}/api/source-audit`, { headers })
  ]);

  response.status(rankings.ok && sources.ok ? 200 : 502).json({
    ok: rankings.ok && sources.ok,
    refreshedAt: new Date().toISOString(),
    services: { rankings: rankings.status, sources: sources.status }
  });
}
