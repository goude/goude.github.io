import type { Root, BlockContent } from "mdast";

export default function remarkSectionWrapper() {
  return (tree: Root) => {
    const newChildren: BlockContent[] = [];
    let buffer: BlockContent[] = [];

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
      buffer.push(node as BlockContent); // Safe because Root children are all Content
    }

    flush();
    tree.children = newChildren;
  };
}
