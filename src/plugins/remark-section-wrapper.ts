import { visit } from "unist-util-visit";
import type { Root, Content, Heading } from "mdast";

export default function remarkSectionWrapper() {
  return (tree: Root) => {
    const newChildren: Content[] = [];
    let buffer: Content[] = [];

    const flush = () => {
      if (buffer.length > 0) {
        newChildren.push({
          type: "html",
          value: "<section>",
        });
        newChildren.push(...buffer);
        newChildren.push({
          type: "html",
          value: "</section>",
        });
        buffer = [];
      }
    };

    for (const node of tree.children) {
      if (node.type === "heading") {
        flush();
      }
      buffer.push(node);
    }

    flush(); // flush any remaining content
    tree.children = newChildren;
  };
}
