import { visit } from "unist-util-visit";

export default function remarkLinkTransformer() {
  return (tree) => {
    // First, handle image references of the form ![[filename|alt text]]
    visit(tree, "text", (node, index, parent) => {
      const imageRegex = /!\[\[([^|\]]+)(?:\|([^]]+))?\]\]/g;
      let match;
      let lastIndex = 0;
      const newNodes = [];

      while ((match = imageRegex.exec(node.value)) !== null) {
        // Push any text before this match
        if (match.index > lastIndex) {
          newNodes.push({
            type: "text",
            value: node.value.slice(lastIndex, match.index),
          });
        }

        const fileName = match[1];
        const altText = match[2] || fileName;

        // Create an AST image node
        newNodes.push({
          type: "image",
          url: `/assets/pages/${fileName}`,
          title: null,
          alt: altText,
        });

        lastIndex = imageRegex.lastIndex;
      }

      // Push any remaining text after the last match
      if (lastIndex < node.value.length) {
        newNodes.push({
          type: "text",
          value: node.value.slice(lastIndex),
        });
      }

      // If we created any new nodes, replace the original text node
      if (newNodes.length > 0) {
        parent.children.splice(index, 1, ...newNodes);
      }
    });

    // You can still include your existing double-bracket link logic here,
    // or add it as another pass with visit(tree, 'text', ...)
  };
}
