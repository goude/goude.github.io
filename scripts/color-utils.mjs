/**
 * Pure color math helpers shared between sync-svg-swatches.mjs and tests.
 */

export function isHexColor(s) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(s).trim());
}

export function hexToRgb(hex) {
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

export function rgbToHex({ r, g, b }) {
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
export function evalColorMix(expr, resolveColor) {
  const s = expr.trim();
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
