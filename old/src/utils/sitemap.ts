import fs from "node:fs";
import path from "node:path";
import getPostData from "./getPostData";
import type { MarkdownPost } from "./getPostData";

/**
 * Returns a list of all routable URLs in the site,
 * both static and from dynamic content collections.
 */
export async function getAllRoutes(
  site: string,
): Promise<{ url: string; title?: string }[]> {
  const staticRoutes = getStaticRoutes("src/pages").map((route) => ({
    url: new URL(route, site).href,
  }));

  const modules = import.meta.glob("../data/blog-posts/*.md");
  const blogPosts: MarkdownPost[] = await Promise.all(
    Object.entries(modules).map(async ([file, resolver]) => {
      const mod = (await resolver()) as Omit<MarkdownPost, "file">;
      return { ...mod, file } satisfies MarkdownPost;
    }),
  );

  const blogRoutes = blogPosts.map((post) => {
    const { slug } = getPostData(post);
    return {
      url: new URL(`/blog/${slug}`, site).href,
      title: post.frontmatter?.title,
    };
  });

  return [...staticRoutes, ...blogRoutes];
}

/**
 * Recursively walks src/pages to discover static routes.
 * Skips dynamic routes like [slug].astro.
 */
function getStaticRoutes(baseDir: string): string[] {
  const result: string[] = [];

  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith(".astro") || entry.name.endsWith(".md")) {
        if (entry.name.includes("[")) continue; // skip dynamic routes
        const rel = path.relative("src/pages", fullPath);
        const route =
          "/" +
          rel
            .replace(/\\/g, "/") // normalize Windows paths
            .replace(/index\.astro$/, "") // /index.astro → /
            .replace(/\.astro$/, "")
            .replace(/\.md$/, "");
        result.push(route || "/");
      }
    }
  }

  walk(baseDir);
  return result.sort();
}
