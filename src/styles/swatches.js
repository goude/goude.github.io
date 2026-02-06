/**
 * Canonical swatch → CSS variable mapping.
 *
 * - Keys MUST match inkscape:label values in SVG
 * - Values MUST be CSS custom properties (without var())
 *
 * Single source of truth.
 */
export const SWATCH_TO_CSS_VAR = {
  "accent-green": "--accent-green",
  "accent-blue": "--accent-blue",
  "accent-purple": "--accent-purple",
  "accent-yellow": "--accent-yellow",
  "accent-red": "--accent-red",

  currentColor: "--fg",

  bg: "--bg",
  fg: "--fg",
  accent: "--accent",
  paper: "--paper",

  "text-muted": "--text-muted",
  rule: "--rule",
  surface: "--surface",
};
