// @ts-check
import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import mdx from "@astrojs/mdx";
import remarkGfm from "remark-gfm";
import remarkSmartypants from "remark-smartypants";
import rehypeExternalLinks from "rehype-external-links";
import remarkImageLinkTransformer from "./src/plugins/remark-image-link-transformer.ts";
import remarkPageLinkTransformer from "./src/plugins/remark-page-link-transformer.ts";

const isTest = process.env.NODE_ENV === "test";
const isDev = process.env.NODE_ENV === "dev";
const site = isTest || isDev ? "http://localhost:4321" : "https://goude.se";

// https://astro.build/config
export default defineConfig({
  site,
  integrations: [mdx(), svelte()],
  vite: {
    define: {
      __BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString()),
    },
  },
  markdown: {
    shikiConfig: {
      theme: "nord",
    },
    remarkPlugins: [
      remarkGfm,
      remarkSmartypants,
      remarkImageLinkTransformer,
      remarkPageLinkTransformer,
    ],
    rehypePlugins: [
      [
        rehypeExternalLinks,
        {
          target: "_blank",
        },
      ],
    ],
  },
});
