import { marked, type Tokens } from "marked";
import { codeToHtml } from "shiki";

/**
 * Render markdown to HTML with Shiki dual-theme syntax highlighting.
 * Returns an HTML string with `.shiki-light` / `.shiki-dark` wrapper divs
 * around each code block, matching the CSS in global styles.
 */
export async function renderMarkdown(raw: string): Promise<string> {
  const renderer = new marked.Renderer();

  renderer.code = function ({ text, lang }: Tokens.Code) {
    return `<!--SHIKI:${lang || "text"}:${Buffer.from(text).toString("base64")}-->`;
  };

  let html = await marked.parse(raw, { gfm: true, renderer });

  const shikiRegex = /<!--SHIKI:([^:]*):([^-]+)-->/g;
  const matches = [...html.matchAll(shikiRegex)];

  for (const match of matches) {
    const lang = match[1] || "text";
    const code = Buffer.from(match[2]!, "base64").toString("utf-8");

    let lightHtml: string;
    let darkHtml: string;
    try {
      [lightHtml, darkHtml] = await Promise.all([
        codeToHtml(code, { lang, theme: "github-light-default" }),
        codeToHtml(code, { lang, theme: "github-dark-default" }),
      ]);
    } catch {
      [lightHtml, darkHtml] = await Promise.all([
        codeToHtml(code, { lang: "text", theme: "github-light-default" }),
        codeToHtml(code, { lang: "text", theme: "github-dark-default" }),
      ]);
    }

    const dual = `<div class="shiki-light">${lightHtml}</div><div class="shiki-dark">${darkHtml}</div>`;
    html = html.replace(match[0], dual);
  }

  return html;
}
