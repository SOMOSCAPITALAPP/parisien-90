import { resolve } from "node:path";
import { existsSync, readdirSync } from "node:fs";
import { defineConfig } from "vite";

const newsEntries = existsSync(resolve(__dirname, "news"))
  ? Object.fromEntries(
      readdirSync(resolve(__dirname, "news"), { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => [`news-${entry.name}`, resolve(__dirname, "news", entry.name, "index.html")])
    )
  : {};

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        transfertPsg: resolve(__dirname, "transfert-psg/index.html"),
        mercatoPsg: resolve(__dirname, "mercato-psg/index.html"),
        actualitePsg: resolve(__dirname, "actualite-psg/index.html"),
        calendrierPsg: resolve(__dirname, "calendrier-psg/index.html"),
        joueursPsg: resolve(__dirname, "joueurs-psg/index.html"),
        sourcesPsg: resolve(__dirname, "sources-psg/index.html"),
        histoirePsg: resolve(__dirname, "histoire-psg/index.html"),
        droitsDisclaimer: resolve(__dirname, "droits-disclaimer/index.html"),
        ...newsEntries
      }
    }
  }
});
