// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  integrations: [sitemap()],
  site: "https://goude.se",
  compressHTML: true,
  build: {
    inlineStylesheets: "auto",
  },
  vite: {
    build: {
      cssMinify: true,
    },
    preview: {
      allowedHosts: ["zelda.lan", "zelda"],
    },
    server: {
      allowedHosts: ["zelda.lan", "zelda"],
    },
  },
});
