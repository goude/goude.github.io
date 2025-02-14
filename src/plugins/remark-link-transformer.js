// Clean this up.
// Rewrite double bracket obsidian links to work within blog posts.
import { visit } from "unist-util-visit";

export default function remarkLinkTransformer() {
  return (tree) => {
    visit(tree, "text", (node, index, parent) => {
      const regex = /\[\[([\w-]+)(?:\|([^\]]+))?\]\]/g;
      let match;
      let lastIndex = 0;
      const newNodes = [];
      while ((match = regex.exec(node.value)) !== null) {
        if (match.index > lastIndex) {
          newNodes.push({
            type: "text",
            value: node.value.slice(lastIndex, match.index),
          });
        }
        newNodes.push({
          type: "link",
          url: `/blog/${match[1]}`,
          children: [{ type: "text", value: match[2] || match[1] }],
        });
        lastIndex = regex.lastIndex;
      }
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
