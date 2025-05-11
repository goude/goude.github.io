import beautify from "js-beautify";
import { readdir, readFile, writeFile } from "fs/promises";
import path from "path";

const html = beautify.html;

const distDir = "./dist";

async function beautifyFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await beautifyFiles(fullPath);
    } else if (entry.name.endsWith(".html")) {
      const content = await readFile(fullPath, "utf8");
      const pretty = html(content, {
        indent_size: 2,
        end_with_newline: true,
        preserve_newlines: true,
      });
      await writeFile(fullPath, pretty, "utf8");
    }
  }
}

beautifyFiles(distDir).catch(console.error);
