import fs from "fs";
import path from "path";
import { visit } from "unist-util-visit";

// Recursively build a mapping from page base filename to its route
function getPageMapping(pagesDir: string): Record<string, string> {
  const mapping: Record<string, string> = {};

  function walk(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stats = fs.statSync(fullPath);
      if (stats.isDirectory()) {
        walk(fullPath);
      } else {
        // Consider markdown and Astro page files
        if (file.endsWith(".md") || file.endsWith(".astro")) {
          const baseName = file.replace(/\.(md|astro)$/, "");
          // Compute the route by removing the pagesDir and file extension
          let relativePath = path.relative(pagesDir, fullPath);
          relativePath = relativePath.replace(/\\/g, "/"); // normalize Windows paths
          relativePath = relativePath.replace(/\.(md|astro)$/, "");
          // Prepend a slash to get the route
          const route = "/" + relativePath;
          mapping[baseName] = route;
        }
      }
    }
  }

  walk(pagesDir);
  return mapping;
}

export default function remarkPageLinkTransformer() {
  // Compute the mapping using the src/pages directory as the root
  const pagesDir = path.join(process.cwd(), "src", "pages");
  const pageMapping = getPageMapping(pagesDir);

  return (tree: any) => {
    // Process text nodes to replace page linking syntax [[page|link text]]
    // Note: this regex is for non-image links (i.e. no preceding "!")
    const pageLinkRegex = /\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g;
    visit(tree, "text", (node: any, index: number, parent: any) => {
      let match: RegExpExecArray | null;
      let lastIndex = 0;
      const newNodes: any[] = [];

      while ((match = pageLinkRegex.exec(node.value)) !== null) {
        // Push any text before the match
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
          // If no matching page is found, leave the original text unchanged
          newNodes.push({
            type: "text",
            value: match[0],
          });
        }
        lastIndex = pageLinkRegex.lastIndex;
      }

      // Add any remaining text after the last match
      if (lastIndex < node.value.length) {
        newNodes.push({
          type: "text",
          value: node.value.slice(lastIndex),
        });
      }

      if (newNodes.length > 0) {
        parent.children.splice(index, 1, ...newNodes);
      }
    });
  };
}
