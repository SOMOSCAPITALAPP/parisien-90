const narrativeImageName = (item) => {
  const text = `${item.category || ""} ${item.title || ""}`.toLowerCase();

  if (/ligue des champions|champions league|uefa/.test(text)) return "europe";
  if (/mercato|transfert|arriv|depart|contrat/.test(text)) return "mercato";
  if (/tactique|composition|systeme|pressing|jeu/.test(text)) return "tactique";
  if (/histoire|ancien|ronaldinho|neymar|messi|rai|valdo/.test(text)) return "histoire";
  if (/victoire|r[ée]cital|double|triple|sacre|exploit|six buts/.test(text)) return "victoire";
  if (/blessure|forfait|defaite|nul|incertain|absence/.test(text)) return "resilience";
  return "joueur";
};

// Original in-house illustrations: no player likenesses, club marks or third-party photographs.
export const articleVisualPath = (item) => `/images/editorial/${narrativeImageName(item)}.png`;

export const generateEditorialVisuals = async () => {
  // Narrative assets are versioned in public/images/editorial and selected for every new article.
};
