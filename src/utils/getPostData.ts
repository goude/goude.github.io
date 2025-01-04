import readingTime from "reading-time";

/*
type Post = {
  title: string
  file: string
  rawContent: () => string
}

export default function getPostData(post: Post) {
  return {
    slug: post.file.split("/").pop()!.split(".").shift(), // FIXME: using ! for now
    readingTime: readingTime(post.rawContent()).text
  }
}
*/

type MarkdownPost = {
  frontmatter: { title: string; publishDate: string; [key: string]: any };
  Content: any; // Or a more specific type if you know it
  file: string;
  rawContent: () => string;
};

export default function getPostData(post: MarkdownPost) {
  return {
    slug: post.file.split("/").pop()!.split(".").shift(), // FIXME: using ! for now
    readingTime: readingTime(post.rawContent()).text,
  };
}
