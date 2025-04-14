import { visit } from "unist-util-visit";

export default function remarkImageLinkTransformer() {
  return (tree, file) => {
    // Retrieve the file path from the vfile history. Adjust as needed.
    const filePath = (file.history && file.history[0]) || "";
    // Use "/assets/blog/" if the file path indicates a blog post; otherwise use "/assets/pages/"
    const baseUrl =
      filePath.includes("/blog/") || filePath.includes("/blog-posts/")
        ? "/assets/blog/"
        : "/assets/pages/";

    const imageRegex = /!\[\[([^|\]]+)(?:\|([^]]+))?\]\]/g;
    const visitor = (node, index, parent) => {
      let match;
      let lastIndex = 0;
      const newNodes = [];

      while ((match = imageRegex.exec(node.value)) !== null) {
        // Add text preceding the match as a text node
        if (match.index > lastIndex) {
          newNodes.push({
            type: "text",
            value: node.value.slice(lastIndex, match.index),
          });
        }
        const fileName = match[1];
        const altText = match[2] || fileName;
        // Create an image node using the selected baseUrl
        newNodes.push({
          type: "image",
          url: `${baseUrl}${fileName}`,
          title: null,
          alt: altText,
        });
        lastIndex = imageRegex.lastIndex;
      }

      // Append any remaining text after the last match
      if (lastIndex < node.value.length) {
        newNodes.push({
          type: "text",
          value: node.value.slice(lastIndex),
        });
      }

      // Replace the original node with the newly created nodes in the parent
      if (newNodes.length > 0 && parent && typeof index === "number") {
        parent.children.splice(index, 1, ...newNodes);
      }
    };

    visit(tree, "text", visitor);
  };
}
