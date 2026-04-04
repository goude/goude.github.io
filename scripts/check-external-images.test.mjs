import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const SRC_DIR = path.resolve(import.meta.dirname, "../src");

/** Recursively collect all files matching an extension under dir. */
function collectFiles(dir, ext) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(full, ext));
    } else if (entry.isFile() && entry.name.endsWith(ext)) {
      results.push(full);
    }
  }
  return results;
}

/** Match <img ...src="https://..."> across tag boundaries (multiline). */
const IMG_EXTERNAL_SRC = /<img\b[^>]*\bsrc=["']https?:\/\/[^"']+["'][^>]*>/gis;

describe("external image references in source files", () => {
  it("no .astro file uses an external http(s) URL as <img src>", () => {
    const astroFiles = collectFiles(SRC_DIR, ".astro");
    const violations = [];

    for (const file of astroFiles) {
      const content = fs.readFileSync(file, "utf8");
      const matches = [...content.matchAll(IMG_EXTERNAL_SRC)];
      for (const m of matches) {
        const lineNumber = content.slice(0, m.index).split("\n").length;
        violations.push(`${path.relative(SRC_DIR, file)}:${lineNumber}: ${m[0].slice(0, 80)}…`);
      }
    }

    expect(violations, `External <img src> URLs found:\n${violations.join("\n")}`).toEqual([]);
  });
});
