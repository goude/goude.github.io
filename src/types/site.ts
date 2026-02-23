/**
 * Site-wide type definitions
 */

export interface SiteMetadata {
  title: string;
  description: string;
  author: string;
  url: string;
}

export interface PageProps {
  title?: string;
  description?: string;
  current?: string;
}

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  external?: boolean;
}

export const SITE: SiteMetadata = {
  title: "goude.se",
  description: "Personal site of Daniel Goude",
  author: "Daniel Goude",
  url: "https://goude.se",
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/hello", label: "Hello", icon: "fa fa-hand-spock" },
  { href: "/notes", label: "NOTES.md", icon: "fa fa-note-sticky" },
  {
    href: "/t/ambient-improvement-positive-residue",
    label: "Ambient Improvement",
    icon: "fa fa-broom",
  },
  {
    href: "https://github.com/goude",
    label: "GitHub (goude)",
    icon: "fa-brands fa-github",
    external: true,
  },
  {
    href: "https://www.instagram.com/doitpoorly/",
    label: "Instagram (doitpoorly)",
    icon: "fa-brands fa-square-instagram",
    external: true,
  },
  {
    href: "https://buymeacoffee.com/goude",
    label: "Coffee",
    icon: "fa-solid fa-mug-saucer",
    external: true,
  },
];
