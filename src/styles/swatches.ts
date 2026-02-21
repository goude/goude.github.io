// src/styles/swatches.ts
import { SWATCH_TO_CSS_VAR as SWATCH_TO_CSS_VAR_JS } from "./swatches.js";

export const SWATCH_TO_CSS_VAR = SWATCH_TO_CSS_VAR_JS as Record<
  string,
  `--${string}`
>;
