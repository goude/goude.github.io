import fs from "node:fs";
import path from "node:path";
import { getCollection, type CollectionEntry } from "astro:content";
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

  const blogPosts = await getCollection("blog-posts");
  const blogRoutes = blogPosts.map((post: CollectionEntry<"blog-posts">) => ({
    url: new URL(`/blog/${post.slug}`, site).href,
    title: post.data.title,
  }));

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
        let rel = path.relative("src/pages", fullPath);
        let route =
          "/" +
          rel
            .replace(/\\/g, "/") // normalize Windows paths
            .replace(/index\.astro$/, "") // /index.astro → /
            .replace(/\.astro$/, "")
            .replace(/\.md$/, "");
        if (!route.endsWith("/")) route = route;
        result.push(route || "/");
      }
    }
  }

  walk(baseDir);
  return result.sort();
}
