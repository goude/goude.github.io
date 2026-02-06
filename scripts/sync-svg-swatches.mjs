#!/usr/bin/env node
/**
 * Sync CSS theme colors → Inkscape SVG swatches.
 *
 * Usage:
 *   node scripts/sync-svg-swatches.mjs light
 *   node scripts/sync-svg-swatches.mjs dark
 *   node scripts/sync-svg-swatches.mjs --verbose light
 *   node scripts/sync-svg-swatches.mjs -v dark
 */

import fs from "fs";
import postcss from "postcss";
import { XMLParser, XMLBuilder } from "fast-xml-parser";
import { SWATCH_TO_CSS_VAR } from "../src/styles/swatches.js";

// ---------------- args ----------------

const argv = process.argv.slice(2);
const VERBOSE = argv.includes("--verbose") || argv.includes("-v");

// theme can appear anywhere; first non-flag token wins
const THEME =
  argv.find((a) => !a.startsWith("-") && (a === "light" || a === "dark")) ??
  "light";

function vlog(...args) {
  if (VERBOSE) console.log(...args);
}

// ---------------- config ----------------

const CSS_FILE = "src/styles/colors.css";
const SVG_FILE = "src/assets/goude-se-logo.svg";

// ---------------- helpers ----------------

const HR = "─".repeat(60);

function isHexColor(s) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(s).trim());
}

function hexToRgb(hex) {
  const h = hex.trim().toLowerCase();
  if (/^#[0-9a-f]{3}$/.test(h)) {
    const r = parseInt(h[1] + h[1], 16);
    const g = parseInt(h[2] + h[2], 16);
    const b = parseInt(h[3] + h[3], 16);
    return { r, g, b };
  }
  if (/^#[0-9a-f]{6}$/.test(h)) {
    const r = parseInt(h.slice(1, 3), 16);
    const g = parseInt(h.slice(3, 5), 16);
    const b = parseInt(h.slice(5, 7), 16);
    return { r, g, b };
  }
  return null;
}

function rgbToHex({ r, g, b }) {
  const clamp = (x) => Math.max(0, Math.min(255, Math.round(x)));
  const to2 = (n) => clamp(n).toString(16).padStart(2, "0");
  return `#${to2(r)}${to2(g)}${to2(b)}`;
}

/**
 * color-mix(in srgb, C1 P1%, C2)  -> hex
 * Supports:
 *  - second color with implied (100-P1)%
 *  - colors as hex or var(--x)
 */
function evalColorMix(expr, resolveColor) {
  const s = expr.trim();

  // very small parser for the specific pattern you use
  // example: color-mix(in srgb, var(--palette-fg) 58%, var(--palette-bg))
  const m = s.match(
    /^color-mix\(\s*in\s+srgb\s*,\s*(.+?)\s+(\d+(?:\.\d+)?)%\s*,\s*(.+?)\s*\)$/i
  );
  if (!m) return null;

  const c1Raw = m[1].trim();
  const p1 = parseFloat(m[2]);
  const c2Raw = m[3].trim();

  const c1 = resolveColor(c1Raw);
  const c2 = resolveColor(c2Raw);

  if (!c1 || !c2) return null;
  const rgb1 = hexToRgb(c1);
  const rgb2 = hexToRgb(c2);
  if (!rgb1 || !rgb2) return null;

  const w1 = p1 / 100;
  const w2 = 1 - w1;

  return rgbToHex({
    r: rgb1.r * w1 + rgb2.r * w2,
    g: rgb1.g * w1 + rgb2.g * w2,
    b: rgb1.b * w1 + rgb2.b * w2,
  });
}

// ---------------- CSS: parse + theme apply + resolve ----------------

function collectVarsFromRule(rule) {
  const out = {};
  rule.walkDecls((d) => {
    if (d.prop && d.prop.startsWith("--")) out[d.prop] = d.value.trim();
  });
  return out;
}

function mergeVars(dst, src) {
  for (const [k, v] of Object.entries(src)) dst[k] = v;
}

function readCssVarsByTheme(cssText, theme) {
  const root = postcss.parse(cssText);

  const base = {};
  const themeDark = {};
  const themeLight = {};
  const mediaDarkRootNotLight = {};

  root.walk((node) => {
    if (node.type === "rule") {
      const sel = node.selector?.trim();
      if (!sel) return;

      if (sel === ":root") mergeVars(base, collectVarsFromRule(node));
      if (sel === "[data-theme-dark]")
        mergeVars(themeDark, collectVarsFromRule(node));
      if (sel === "[data-theme-light]")
        mergeVars(themeLight, collectVarsFromRule(node));
    }

    if (node.type === "atrule" && node.name === "media") {
      const params = node.params || "";
      if (!/prefers-color-scheme\s*:\s*dark/i.test(params)) return;

      node.walkRules((r) => {
        const sel = r.selector?.trim();
        if (sel === ":root:not([data-theme-light])") {
          mergeVars(mediaDarkRootNotLight, collectVarsFromRule(r));
        }
      });
    }
  });

  const effective = { ...base };

  if (theme === "dark") {
    // your CSS defines both a media-based dark default and explicit [data-theme-dark]
    // we apply both, explicit selector last (more intentional)
    mergeVars(effective, mediaDarkRootNotLight);
    mergeVars(effective, themeDark);
  } else {
    mergeVars(effective, themeLight);
  }

  return {
    base,
    themeDark,
    themeLight,
    mediaDarkRootNotLight,
    effective,
  };
}

function resolveAllColors(effectiveVars) {
  // resolve var() chains + color-mix(in srgb, ...)
  const memo = new Map();
  const visiting = new Set();

  function resolveValueToColor(value) {
    const v = value.trim();

    if (isHexColor(v)) return v.toLowerCase();

    // var(--x) or var(--x, fallback)
    const vm = v.match(/^var\(\s*(--[a-z0-9-_]+)\s*(?:,\s*(.+?)\s*)?\)$/i);
    if (vm) {
      const name = vm[1];
      const fallback = vm[2];
      const r = resolveVar(name);
      if (r) return r;
      if (fallback) return resolveValueToColor(fallback);
      return null;
    }

    // color-mix(...)
    if (/^color-mix\(/i.test(v)) {
      return evalColorMix(v, resolveValueToColor);
    }

    // allow bare tokens that are themselves vars (rare), or "currentColor" etc:
    // we don't want that in SVG stops; return null.
    return null;
  }

  function resolveVar(name) {
    if (memo.has(name)) return memo.get(name);
    if (visiting.has(name)) return null; // cycle
    visiting.add(name);

    const raw = effectiveVars[name];
    if (!raw) {
      visiting.delete(name);
      memo.set(name, null);
      return null;
    }

    const resolved = resolveValueToColor(raw);
    visiting.delete(name);
    memo.set(name, resolved);
    return resolved;
  }

  // build resolved colors for everything we care about
  const out = {};
  for (const cssVar of new Set(Object.values(SWATCH_TO_CSS_VAR))) {
    out[cssVar] = resolveVar(cssVar);
  }

  return out;
}

// ---------------- SVG parsing ----------------

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

const builder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  format: true,
  indentBy: "  ",
  suppressEmptyNode: true,
});

// ---------------- run ----------------

const cssText = fs.readFileSync(CSS_FILE, "utf8");
const cssInfo = readCssVarsByTheme(cssText, THEME);
const resolvedColors = resolveAllColors(cssInfo.effective);

if (VERBOSE) {
  console.log(HR);
  console.log(`Theme: ${THEME}`);
  console.log(HR);
  console.log("Resolved swatch → cssVar → color:");
  for (const [label, cssVar] of Object.entries(SWATCH_TO_CSS_VAR)) {
    const color = resolvedColors[cssVar];
    console.log(
      `  ${label.padEnd(14)} → ${cssVar.padEnd(14)} = ${color ?? "(unresolved)"}`
    );
  }
}

const svgText = fs.readFileSync(SVG_FILE, "utf8");
const svgObj = parser.parse(svgText);

const defs = svgObj.svg.defs ?? (svgObj.svg.defs = {});
let gradients = defs.linearGradient ?? [];
if (!Array.isArray(gradients)) gradients = [gradients];

function isSolidSwatch(g) {
  return (
    g?.["@_inkscape:swatch"] === "solid" &&
    typeof g?.["@_inkscape:label"] === "string"
  );
}

function findSwatchByLabel(label) {
  return gradients.find(
    (g) => isSolidSwatch(g) && g["@_inkscape:label"] === label
  );
}

function getStopStyle(swatch) {
  // Inkscape often stores as stop.style (attribute "style") not "@_style", depending on parser shape.
  // Our builder uses "@_" for attributes; parser reads attributes into "@_" too.
  // In your SVG snippet, stop has attribute "style", so it becomes "@_style".
  return swatch?.stop?.["@_style"] ?? null;
}

function getStopColorFromStyle(style) {
  if (!style) return null;
  const m = style.match(/stop-color:\s*([^;]+)\s*;/i);
  return m ? m[1].trim() : null;
}

function setStopColorOnSwatch(swatch, color) {
  // ensure stop exists
  if (!swatch.stop) swatch.stop = { "@_offset": "0", "@_style": "" };
  if (Array.isArray(swatch.stop)) swatch.stop = swatch.stop[0] ?? {};
  const prev = swatch.stop["@_style"] ?? "";
  // normalize: preserve any stop-opacity, but overwrite stop-color
  let next = prev;

  if (/stop-color\s*:/i.test(next)) {
    next = next.replace(/stop-color\s*:\s*[^;]+/i, `stop-color:${color}`);
  } else {
    next =
      `stop-color:${color};` +
      (next && !next.trim().endsWith(";") ? ";" : "") +
      next;
  }

  if (/stop-opacity\s*:/i.test(next)) {
    // keep existing
  } else {
    // ensure opacity
    next = next.trim();
    if (next && !next.endsWith(";")) next += ";";
    next += "stop-opacity:1;";
  }

  swatch.stop["@_style"] = next;
}

function existingIds() {
  const ids = new Set();
  for (const g of gradients) {
    if (g?.["@_id"]) ids.add(g["@_id"]);
  }
  return ids;
}

function makeUniqueId(base, ids) {
  if (!ids.has(base)) return base;
  let i = 2;
  while (ids.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

function createSwatch(label, color) {
  const ids = existingIds();
  const id = makeUniqueId(`swatch-${label}`, ids);

  return {
    "@_id": id,
    "@_inkscape:swatch": "solid",
    "@_inkscape:label": label,
    stop: {
      "@_offset": "0",
      "@_style": `stop-color:${color};stop-opacity:1;`,
    },
  };
}

// ---------------- sync ----------------

let updated = 0;
let created = 0;
let unchanged = 0;
let skipped = 0;

if (VERBOSE) {
  console.log(HR);
  console.log("Existing SVG solid swatches (label → id → color):");
  for (const g of gradients.filter(isSolidSwatch)) {
    const label = g["@_inkscape:label"];
    const id = g["@_id"] ?? "(no-id)";
    const before = getStopColorFromStyle(getStopStyle(g)) ?? "(no-stop-color)";
    console.log(`  ${label.padEnd(14)} → ${String(id).padEnd(18)} = ${before}`);
  }
  console.log(HR);
  console.log("Applying changes:");
}

for (const [label, cssVar] of Object.entries(SWATCH_TO_CSS_VAR)) {
  const color = resolvedColors[cssVar];
  if (!color) {
    skipped++;
    vlog(`  ! ${label}: ${cssVar} unresolved (can't write a real stop-color)`);
    continue;
  }

  const swatch = findSwatchByLabel(label);

  if (swatch) {
    const style = getStopStyle(swatch);
    const before = getStopColorFromStyle(style);

    if (before && before.toLowerCase() === color.toLowerCase()) {
      unchanged++;
      vlog(`  = ${label}: unchanged (${color})`);
      continue;
    }

    setStopColorOnSwatch(swatch, color);
    updated++;
    vlog(`  ~ ${label}: ${before ?? "(none)"} → ${color}`);
  } else {
    gradients.push(createSwatch(label, color));
    created++;
    vlog(`  + ${label}: created (${color})`);
  }
}

defs.linearGradient = gradients;

// ---------------- write ----------------

const outSvg = builder.build(svgObj).replace(/\n{3,}/g, "\n\n");
fs.writeFileSync(SVG_FILE, outSvg);

console.log(
  `✓ SVG swatches synced (theme=${THEME}) ` +
    `(${updated} updated, ${created} created, ${unchanged} unchanged, ${skipped} skipped)`
);

if (VERBOSE) {
  console.log(HR);
  console.log("Done.");
}
