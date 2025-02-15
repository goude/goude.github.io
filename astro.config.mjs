// @ts-check
import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import mdx from "@astrojs/mdx";
import remarkGfm from "remark-gfm";
import remarkSmartypants from "remark-smartypants";
import rehypeExternalLinks from "rehype-external-links";
import remarkImageLinkTransformer from "./src/plugins/remark-image-link-transformer.ts";
import remarkPageLinkTransformer from "./src/plugins/remark-page-link-transformer.ts";

// https://astro.build/config
export default defineConfig({
  site: "https://goude.se",
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
