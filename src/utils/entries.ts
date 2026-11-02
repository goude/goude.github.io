/** Turn a section's `import.meta.glob` result into linkable entries. */
export function toEntries<Meta>(
  modules: Record<string, { frontmatter: Meta }>,
  section: string
) {
  return Object.entries(modules).map(([path, mod]) => {
    const slug = path
      .split("/")
      .pop()!
      .replace(/\.(md|astro)$/, "");
    return { href: `/${section}/${slug}`, ...mod.frontmatter };
  });
}
