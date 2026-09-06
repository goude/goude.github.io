/**
 * Site-wide type definitions
 */

export interface SiteMetadata {
  title: string;
  description: string;
  author: string;
  url: string;
}

export interface NavItem {
  href: string;
  label: string;
  external?: boolean;
}

export interface Breadcrumb {
  label: string;
  href?: string;
}

export const SITE: SiteMetadata = {
  title: "goude.se",
  description: "Personal site of Daniel Goude",
  author: "Daniel Goude",
  url: "https://goude.se",
};

export const PAPER_NAV_INTERNAL: NavItem[] = [
  { href: "/", label: "Index" },
  { href: "/notes", label: "Notes" },
  { href: "/essays", label: "Essays" },
];

export const PAPER_NAV_EXTERNAL: NavItem[] = [
  { href: "https://github.com/goude", label: "GitHub (goude)", external: true },
  {
    href: "https://www.instagram.com/doitpoorly/",
    label: "Instagram (doitpoorly)",
    external: true,
  },
  {
    href: "https://buymeacoffee.com/goude",
    label: "Coffee",
    external: true,
  },
];
