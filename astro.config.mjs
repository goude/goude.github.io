// @ts-check
import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import mdx from "@astrojs/mdx";
import remarkGfm from "remark-gfm";
import remarkSmartypants from "remark-smartypants";
import rehypeExternalLinks from "rehype-external-links";
import remarkLinkTransformer from "./src/plugins/remark-link-transformer.js";

// https://astro.build/config
export default defineConfig({
  site: "https://goude.se",
  integrations: [mdx(), svelte()],
  markdown: {
    shikiConfig: {
      theme: "nord",
    },
    remarkPlugins: [remarkGfm, remarkSmartypants, remarkLinkTransformer],
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
