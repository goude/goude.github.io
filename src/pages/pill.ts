//export const prerender = false;

import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ request }) => {
  const requestUrl = new URL(request.url);
  const params = requestUrl.searchParams;

  const leftParam = params.get("left");
  const rightParam = params.get("right");

  const left = (leftParam ?? "DEFAULT L").slice(0, 20);
  const right = (rightParam ?? "DEFAULT R").slice(0, 20);

  /*
  console.log("🔍 pill.ts");
  console.log("  Full request object:", request);
  console.log("  Raw URL:", request.url);
  console.log("  Parsed left:", leftParam);
  console.log("  Parsed right:", rightParam);
  console.log("  Final SVG text:", { left, right });
  */

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="160" height="40">
  <style>
    text {
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      font-size: 14px;
      dominant-baseline: middle;
      text-anchor: middle;
    }
  </style>

  <!-- Background halves -->
  <rect x="0" y="0" width="80" height="40" fill="black" />
  <rect x="80" y="0" width="80" height="40" fill="white" />

  <!-- Border -->
  <rect x="0.5" y="0.5" width="159" height="39" rx="20" ry="20"
        fill="none" stroke="black" stroke-width="1" />

  <!-- Text -->
  <text x="40" y="20" fill="white">${left}</text>
  <text x="120" y="20" fill="black">${right}</text>
</svg>
`.trim();

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
