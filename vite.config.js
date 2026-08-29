import { resolve } from "node:path";
import { existsSync, readdirSync } from "node:fs";
import { defineConfig } from "vite";

const nestedEntries = (root, prefix) =>
  existsSync(resolve(__dirname, root))
  ? Object.fromEntries(
      readdirSync(resolve(__dirname, root), { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => [`${prefix}-${entry.name}`, resolve(__dirname, root, entry.name, "index.html")])
    )
  : {};

const newsEntries = nestedEntries("news", "news");
const playerEntries = nestedEntries("joueurs-psg", "joueur");
const legendEntries = nestedEntries("anciens-joueurs-psg", "ancien");
const staffEntries = nestedEntries("staff-psg", "staff");

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        transfertPsg: resolve(__dirname, "transfert-psg/index.html"),
        mercatoPsg: resolve(__dirname, "mercato-psg/index.html"),
        actualitePsg: resolve(__dirname, "actualite-psg/index.html"),
        viralPsg: resolve(__dirname, "viral-psg/index.html"),
        videosPsg: resolve(__dirname, "videos-psg/index.html"),
        calendrierPsg: resolve(__dirname, "calendrier-psg/index.html"),
        joueursPsg: resolve(__dirname, "joueurs-psg/index.html"),
        recordsPsg: resolve(__dirname, "records-psg/index.html"),
        anciensJoueursPsg: resolve(__dirname, "anciens-joueurs-psg/index.html"),
        sourcesPsg: resolve(__dirname, "sources-psg/index.html"),
        histoirePsg: resolve(__dirname, "histoire-psg/index.html"),
        droitsDisclaimer: resolve(__dirname, "droits-disclaimer/index.html"),
        mentionsLegales: resolve(__dirname, "mentions-legales/index.html"),
        confidentialite: resolve(__dirname, "confidentialite/index.html"),
        cookies: resolve(__dirname, "cookies/index.html"),
        contactRetrait: resolve(__dirname, "contact-retrait/index.html"),
        charteEditoriale: resolve(__dirname, "charte-editoriale/index.html"),
        controleSources: resolve(__dirname, "controle-sources/index.html"),
        suiviAudience: resolve(__dirname, "suivi-audience/index.html"),
        ...newsEntries,
        ...playerEntries,
        ...legendEntries,
        ...staffEntries
      }
    }
  }
});
