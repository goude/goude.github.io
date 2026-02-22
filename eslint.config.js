import js from "@eslint/js";
import tseslint from "typescript-eslint";
import astro from "eslint-plugin-astro";

export default [
  // 1) Never lint generated output / vendored assets
  {
    ignores: [
      "node_modules/**",
      ".astro/**",
      "dist/**",
      ".output/**",
      "public/**",
      "coverage/**",
    ],
  },

  // 2) If you want JS rules for your own JS, scope them (don’t unleash them on dist/)
  {
    ...js.configs.recommended,
    files: ["scripts/**/*.{js,mjs}", "src/**/*.{js,mjs}"],
  },

  // 3) TS + Astro (only source)
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,

  // 4) Enable type-aware linting where it matters
  {
    files: ["src/**/*.{ts,astro}"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
  },

  // 5) Node globals for scripts (avoids “process/console is not defined”)
  {
    files: ["scripts/**/*.{js,mjs}"],
    languageOptions: {
      globals: {
        process: "readonly",
        console: "readonly",
      },
    },
  },
];