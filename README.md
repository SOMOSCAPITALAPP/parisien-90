# Parisien 90

Refonte complète d'un site d'actualité PSG inspirée de l'audit de footparisien.com.

## Audit rapide

- Le site existant privilégie un flux de liens très dense, avec peu de hiérarchie visuelle.
- Les contenus live, mercato, éditoriaux et navigation sont mélangés dans une seule page longue.
- L'expérience mobile et la lisibilité éditoriale peuvent être renforcées.
- Les signaux de confiance, filtres, dossiers chauds et prochains matchs ne sont pas mis en avant comme des outils de lecture.

## Refonte

- Une hero éditoriale avec image propriétaire et accès immédiat au live.
- Un flux filtrable par catégorie avec recherche.
- Un tableau mercato synthétique avec probabilité, tendance et statut.
- Des modules latéraux pour matchs, fiabilité des sources et briefing.
- Une page Sources PSG qui distingue le lien autorise, la veille manuelle et les usages qui demandent accord/licence.
- Une page Histoire PSG pour le contenu evergreen : origines, palmares, epoques et legendes.
- Une base Vite statique multi-pages prête à déployer sur Vercel.

## Commandes

```bash
npm install
npm run dev
npm run build
```

## Suivi audience

- Web Analytics : https://vercel.com/somos-capital-apps-projects/parisien-90/analytics
- Speed Insights : https://vercel.com/somos-capital-apps-projects/parisien-90/speed-insights
- Logs production : https://vercel.com/somos-capital-apps-projects/parisien-90/logs
- Page interne noindex : https://parisien90.com/suivi-audience/

## Suivi SEO (Search Console)

- Endpoint local : `GET /api/gsc-rankings` (protégé par `CRON_SECRET`)
- Mise à jour ponctuelle : `GET /api/gsc-rankings?public=1`
- Export local : `npm run seo:gsc` (génère `public/seo-gsc-report.json`)
- Variables d’environnement attendues pour la connexion GSC :
  - `GSC_SITE_URL` (ex. `https://parisien90.com/`)
  - `GSC_SERVICE_ACCOUNT_JSON` (objet JSON du compte de service **ou** `GSC_SERVICE_ACCOUNT_EMAIL` + `GSC_PRIVATE_KEY`)
  - `CRON_SECRET` (pour déclencher depuis Vercel Cron)
