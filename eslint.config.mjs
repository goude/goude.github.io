import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: ["dist/**", ".astro/**", "**/*.d.ts"],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      // You’re using empty `catch {}` intentionally in a few places.
      // Keep it allowed, but still forbid other empty blocks.
      "no-empty": ["error", { allowEmptyCatch: true }],

      // Keep signal, avoid churn.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },

  // Allow `any` only where it’s acting as a boundary with external/untyped data.
  {
    files: [
      "src/plugins/remark-page-link-transformer.ts",
      "src/utils/getPostData.ts",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
