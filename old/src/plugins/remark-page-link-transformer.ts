import fs from "fs";
import path from "path";
import { visit } from "unist-util-visit";

// This transformer scans your src/pages directory for Markdown or Astro files,
// builds a mapping from page base filenames to their routes, and then rewrites
// occurrences of [[page|link text]] to standard Markdown links.
export default function remarkPageLinkTransformer() {
  return (tree: any) => {
    const pagesDir = path.join(process.cwd(), "src", "pages");
    const pageMapping: Record<string, string> = {};

    function walk(dir: string): void {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) {
          walk(fullPath);
        } else {
          if (file.endsWith(".md") || file.endsWith(".astro")) {
            const baseName = file.replace(/\.(md|astro)$/, "");
            let relativePath = path
              .relative(pagesDir, fullPath)
              .replace(/\\/g, "/");
            relativePath = relativePath.replace(/\.(md|astro)$/, "");
            // Prepend a slash to form the route.
            const route = "/" + relativePath;
            pageMapping[baseName] = route;
          }
        }
      }
    }
    walk(pagesDir);

    // Regex for matching the [[page|link text]] syntax.
    const pageLinkRegex = /\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g;

    const visitor = (node: any, index: number | null, parent: any) => {
      let match: RegExpExecArray | null;
      let lastIndex = 0;
      const newNodes: any[] = [];

      while ((match = pageLinkRegex.exec(node.value)) !== null) {
        if (match.index > lastIndex) {
          newNodes.push({
            type: "text",
            value: node.value.slice(lastIndex, match.index),
          });
        }
        const pageName = match[1];
        const linkText = match[2] || pageName;
        const route = pageMapping[pageName];
        if (route) {
          newNodes.push({
            type: "link",
            url: route,
            title: null,
            children: [{ type: "text", value: linkText }],
          });
        } else {
          newNodes.push({
            type: "text",
            value: match[0],
          });
        }
        lastIndex = pageLinkRegex.lastIndex;
      }

      if (lastIndex < node.value.length) {
        newNodes.push({
          type: "text",
          value: node.value.slice(lastIndex),
        });
      }

      if (newNodes.length > 0 && parent && typeof index === "number") {
        parent.children.splice(index, 1, ...newNodes);
      }
    };

    // Cast visitor as any to satisfy the overload.
    visit(tree, "text", visitor as any);
  };
}
