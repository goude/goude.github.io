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
