import { visit } from "unist-util-visit";

export default function remarkImageLinkTransformer() {
  return (tree: any) => {
    // Regex to match image links of the form ![[filename|alt text]]
    const imageRegex = /!\[\[([^|\]]+)(?:\|([^]]+))?\]\]/g;

    const visitor = (node: any, index: number | null, parent: any) => {
      let match: RegExpExecArray | null;
      let lastIndex = 0;
      const newNodes: any[] = [];

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
          url: `/assets/pages/${fileName}`,
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

      if (newNodes.length > 0 && parent && typeof index === "number") {
        parent.children.splice(index, 1, ...newNodes);
      }
    };

    // Cast visitor as any to match the expected overload
    visit(tree, "text", visitor as any);
  };
}
