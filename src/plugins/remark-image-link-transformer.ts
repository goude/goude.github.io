import { visit } from "unist-util-visit";
import type { Node } from "unist";
import type { VFile } from "vfile";
import type { Parent } from "unist";

interface TextNode extends Node {
  type: "text";
  value: string;
}

interface ImageNode extends Node {
  type: "image";
  url: string;
  title: string | null;
  alt: string;
}

export default function remarkImageLinkTransformer() {
  return (tree: Node, file: VFile) => {
    const filePath = (file.history && file.history[0]) || "";
    const baseUrl =
      filePath.includes("/blog/") || filePath.includes("/blog-posts/")
        ? "/assets/blog/"
        : "/assets/pages/";

    const imageRegex = /!\[\[([^|\]]+)(?:\|([^]]+))?\]\]/g;

    const visitor = (
      node: TextNode,
      index: number | null,
      parent: Parent | null,
    ) => {
      if (typeof node.value !== "string") return;

      let match;
      let lastIndex = 0;
      const newNodes: (TextNode | ImageNode)[] = [];

      while ((match = imageRegex.exec(node.value)) !== null) {
        if (match.index > lastIndex) {
          newNodes.push({
            type: "text",
            value: node.value.slice(lastIndex, match.index),
          });
        }

        const fileName = match[1];
        const altText = match[2] || fileName;

        newNodes.push({
          type: "image",
          url: `${baseUrl}${fileName}`,
          title: null,
          alt: altText,
        });

        lastIndex = imageRegex.lastIndex;
      }

      if (lastIndex < node.value.length) {
        newNodes.push({
          type: "text",
          value: node.value.slice(lastIndex),
        });
      }

      if (
        newNodes.length > 0 &&
        parent &&
        typeof index === "number" &&
        Array.isArray(parent.children)
      ) {
        parent.children.splice(index, 1, ...newNodes);
      }
    };

    visit(tree, "text", visitor);
  };
}
