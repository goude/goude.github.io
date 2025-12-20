// @ts-check
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://goude.se",
  compressHTML: true,
  build: {
    inlineStylesheets: "auto",
  },
  vite: {
    build: {
      cssMinify: true,
    },
  },
});
