import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { getDocsFiles, getDocsDir } from "./docs.js";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "docs-test-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("getDocsFiles", () => {
  it("returns empty array for empty directory", () => {
    expect(getDocsFiles(tmpDir)).toEqual([]);
  });

  it("returns a DocEntry for a markdown file", () => {
    fs.writeFileSync(path.join(tmpDir, "guide.md"), "# Guide Title\nContent.");
    const entries = getDocsFiles(tmpDir);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      slug: "guide",
      title: "Guide Title",
    });
    expect(entries[0]!.filePath).toBe(path.join(tmpDir, "guide.md"));
  });

  it("uses filename as title when no H1 heading present", () => {
    fs.writeFileSync(path.join(tmpDir, "notes.md"), "no heading here");
    const entries = getDocsFiles(tmpDir);
    expect(entries[0]!.title).toBe("notes");
  });

  it("ignores non-markdown files", () => {
    fs.writeFileSync(path.join(tmpDir, "readme.txt"), "text file");
    fs.writeFileSync(path.join(tmpDir, "data.json"), "{}");
    expect(getDocsFiles(tmpDir)).toHaveLength(0);
  });

  it("recurses into subdirectories", () => {
    const sub = path.join(tmpDir, "sub");
    fs.mkdirSync(sub);
    fs.writeFileSync(path.join(sub, "nested.md"), "# Nested");
    const entries = getDocsFiles(tmpDir);
    expect(entries).toHaveLength(1);
    expect(entries[0]!.slug).toBe(path.join("sub", "nested"));
    expect(entries[0]!.title).toBe("Nested");
  });

  it("collects files from both root and subdirectory", () => {
    fs.writeFileSync(path.join(tmpDir, "root.md"), "# Root");
    const sub = path.join(tmpDir, "sub");
    fs.mkdirSync(sub);
    fs.writeFileSync(path.join(sub, "child.md"), "# Child");
    const entries = getDocsFiles(tmpDir);
    expect(entries).toHaveLength(2);
    const slugs = entries.map((e) => e.slug);
    expect(slugs).toContain("root");
    expect(slugs).toContain(path.join("sub", "child"));
  });

  it("picks first H1 when multiple headings exist", () => {
    fs.writeFileSync(
      path.join(tmpDir, "multi.md"),
      "# First Heading\n## Second\n# Third"
    );
    const entries = getDocsFiles(tmpDir);
    expect(entries[0]!.title).toBe("First Heading");
  });
});

describe("getDocsDir", () => {
  it("returns an absolute path ending with 'docs'", () => {
    const dir = getDocsDir();
    expect(path.isAbsolute(dir)).toBe(true);
    expect(dir.endsWith("docs")).toBe(true);
  });

  it("points to cwd/docs", () => {
    const expected = path.resolve(process.cwd(), "docs");
    expect(getDocsDir()).toBe(expected);
  });
});
