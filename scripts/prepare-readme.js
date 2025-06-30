// scripts/prepare-readme.js
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

// Paths
const src = resolve(process.cwd(), "README.md");
const dst = resolve(process.cwd(), "src/pages/README.md");

// Front-matter to tack on
const header = `---
title: README
description: The README file for goude.se.
layout: ../layouts/BaseLayout.astro
---
`;

// Read root README, then write header + content into src/pages/readme.md
const content = readFileSync(src, "utf-8");
writeFileSync(dst, header + content, "utf-8");
