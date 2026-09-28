// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

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
