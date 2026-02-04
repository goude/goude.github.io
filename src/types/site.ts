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
  {
    href: "https://github.com/goude",
    label: "GitHub",
    icon: "fa-brands fa-github",
    external: true,
  },
  {
    href: "https://buymeacoffee.com/goude",
    label: "Coffee",
    icon: "fa-solid fa-mug-saucer",
    external: true,
  },
];
