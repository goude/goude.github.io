import type { APIRoute } from "astro";
import { getAllRoutes } from "../utils/sitemap";

export const GET: APIRoute = async ({ site }) => {
  if (!site) {
    return new Response("Missing site URL in config.", { status: 500 });
  }

  const routes = await getAllRoutes(site.toString());

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(({ url }) => `  <url><loc>${url}</loc></url>`).join("\n")}
</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
};
