# goude.se

[https://github.com/goude/goude.github.io](https://github.com/goude/goude.github.io)

Transmitting. Listen.

## Getting Started

This project uses [just](https://github.com/casey/just) as its task runner.
All common commands (install, build, dev server, tests, etc.) are defined in the `Justfile`.

### 1. Install `just`

**macOS (Homebrew):**
`brew install just`

**Linux (Ubuntu/Debian/WSL2):**
`sudo apt update`
`sudo apt install just`

If your distro doesn’t have a recent version, see the [official install docs](https://github.com/casey/just#installation) for alternatives (curl, cargo, etc.).

### 2. Run the bootstrap

From the project root:
`just`

This will print a Quickstart guide and list all available tasks.
For example:

- `just core-quickstart` → verify tools, install deps, run checks, start dev server
- `just dev-start` → start dev server (after first setup)
- `just dev-build && just dev-preview` → build and preview production

That’s it — the only instruction you need is: **run `just`.**
