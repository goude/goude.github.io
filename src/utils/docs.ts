import fs from "node:fs";
import path from "node:path";

export interface DocEntry {
  slug: string;
  filePath: string;
  title: string;
}

export function getDocsFiles(dir: string, base = ""): DocEntry[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: DocEntry[] = [];

  for (const entry of entries) {
    const rel = path.join(base, entry.name);
    if (entry.isDirectory()) {
      files.push(...getDocsFiles(path.join(dir, entry.name), rel));
    } else if (entry.name.endsWith(".md")) {
      const filePath = path.join(dir, entry.name);
      const content = fs.readFileSync(filePath, "utf-8");
      const titleMatch = content.match(/^#\s+(.+)$/m);
      files.push({
        slug: rel.replace(/\.md$/, ""),
        filePath,
        title: titleMatch?.[1] ?? entry.name.replace(/\.md$/, ""),
      });
    }
  }
  return files;
}

export function getDocsDir(): string {
  return path.resolve(process.cwd(), "docs");
}
