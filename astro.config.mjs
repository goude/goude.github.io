// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { readFileSync } from "node:fs";

// The version is read here, not imported by a component: Astro restarts the dev
// server on any package.json change, and a component import would also make
// Vite reload the browser into that restart gap ("Unable to connect").
const { version } = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8")
);

export default defineConfig({
  integrations: [sitemap()],
  site: "https://goude.se",
  compressHTML: true,
  markdown: {
    shikiConfig: {
      theme: "github-light",
    },
  },
  build: {
    inlineStylesheets: "auto",
  },
  vite: {
    define: {
      __SITE_VERSION__: JSON.stringify(version),
    },
    build: {
      cssMinify: true,
    },
    preview: {
      // Extra hostnames allowed to reach `astro preview`, comma-separated,
      // e.g. PREVIEW_ALLOWED_HOSTS=myhost.lan,myhost. Kept out of the repo.
      allowedHosts: (process.env.PREVIEW_ALLOWED_HOSTS ?? "")
        .split(",")
        .map((h) => h.trim())
        .filter(Boolean),
    },
  },
});
