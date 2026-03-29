# Justfile Conventions

Run `just` after cloning. Everything follows from there.

## Preamble

```just
set shell := ["bash", "-eu", "-o", "pipefail", "-c"]
```

Add `set dotenv-load := true` when the project uses `.env` files.

## Default recipe

Bare `just` must always be safe and informative.

```just
_default:
    @printf "After cloning: run just setup\n\n"
    @just --list
```

The `_` prefix hides it from the list. Drop the printf line for small projects.

## Recipe names

Standardized across ecosystems. Not every project needs every recipe.

| Intent        | Name    | Notes                                     |
| ------------- | ------- | ----------------------------------------- |
| Install deps  | `setup` | First thing after cloning                 |
| Run (dev)     | `dev`   | Debug mode, hot reload, etc.              |
| Run (release) | `run`   | Optimized build + run                     |
| Build         | `build` | Produce artifact without running          |
| Format        | `fmt`   | Node projects may use `format`            |
| Lint          | `lint`  |                                           |
| Test          | `test`  |                                           |
| All checks    | `check` | Gate before committing: fmt → lint → test |
| Clean         | `clean` | Remove caches/artifacts, keep deps        |
| Nuclear reset | `reset` | Remove everything, reinstall              |

`check` ordering matters — format before lint so autofixes don't trigger lint failures.

## Docstrings

Every recipe gets a comment. This is what makes `just --list` self-explanatory. If there
is a fitting emoji, use for visual scanning clarity.

```just
# 🛠️ Build for production
build:
    cargo build --release
```

## Arguments, variables, aliases

```just
# Variables at the top for shared references
app_name := "myapp"
API_PORT := env("API_PORT", "8000")

# Arguments use just's parameter syntax
log service:
    docker compose logs --follow {{service}}

# Aliases sparingly, for ergonomics
alias dev := local-backend-dev
```

## Docker recipes

Prefix with `docker-`: `docker-up`, `docker-down`, `docker-restart`, `docker-rebuild`.

## Guidelines

- `just --list` should fit on one screen.
- If a recipe exceeds ~10 lines, move the script to `scripts/` and call it.
- The justfile is an index, not a script library.

## Document Backlog

- Revisit at a later point to revise with new learnings
