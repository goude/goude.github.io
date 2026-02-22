// src/env.d.ts
// This file is the ambient type declaration entry point for the project.
// TypeScript picks it up automatically because it sits in the source root
// and matches the `include` glob in tsconfig.json. No import needed anywhere.

/// <reference types="astro/client" />
// Triple-slash reference directives are TypeScript's pre-module way of saying
// "pull in this type package globally". They're processed at compile time,
// before normal imports, and inject declarations into the global scope rather
// than into a module. Equivalent to listing the package in tsconfig "types: []"
// but scoped to files that include the directive — useful when you want to be
// explicit about where globals come from.
//
// "astro/client" adds Astro-specific globals: ImportMeta (import.meta.env),
// image asset types, content collection types, and the Astro namespace.
// Without this, tsc wouldn't know what `import.meta.env.PUBLIC_*` is.

/// <reference types="youtube" />
// Pulls in @types/youtube, which declares the global `YT` namespace —
// YT.Player, YT.PlayerState, etc. — and merges `YT` into Window.
// The YouTube IFrame API loads asynchronously via a <script> tag and attaches
// itself to window.YT at runtime; this tells tsc what shape to expect there.
// Added here rather than in tsconfig "types" array to keep it visible and
// explicit at the declaration site, and because Astro's tsconfig extends
// may reset that array.
