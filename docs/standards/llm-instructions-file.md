# LLM Instructions File

A project-root file (`CLAUDE.md`, `.cursorrules`, `AGENTS.md`, etc.) that gives an LLM
working in the codebase its operational policy. Not documentation. Not style guide. Policy.

**Target: under 200 lines.** If it's longer, it has become documentation and the LLM will
discount it. Link to deeper docs; don't inline them.

## Skeleton

A good instructions file has five sections in this order. Not every project needs all five.
The first two are near-universal.

### 1. Session discipline (required)

Prevents the most expensive failure mode: the LLM writing a 400-line file, timing out,
and retrying identically until context is exhausted.

```markdown
## Session Discipline

- Never write >150 lines in a single tool call
- For files >100 lines: create skeleton first, fill sections in subsequent edits
- Never retry a timed-out operation identically — break it smaller
- On interrupt: stop immediately, commit partial work, then reassess
- After any file edit, re-read before editing again (stale context kills diffs)
```

Adapt the line limits to your tooling. The principle is: **small writes, frequent reads,
no blind retries.**

### 2. Module boundaries

A table. Not prose. Prose drifts; tables get checked.

```markdown
## Boundaries

| Module | May import from | Must NOT import from |
| ------ | --------------- | -------------------- |
| core/  | (stdlib only)   | ui/, cli/, io/       |
| io/    | core/           | ui/, cli/            |
| ui/    | core/, io/      | cli/                 |
| cli/   | core/, ui/, io/ |                      |
```

If enforced by tooling (lint rule, CI check), say so. If not, mark it as a soft rule so
the LLM knows violation is possible but undesirable.

### 3. Ownership map

One line per module or file. Prevents duplicate logic and tells the LLM where new code
belongs.

```markdown
## Ownership

- `src/core/` — domain model, pure logic, no side effects
- `src/io/` — file and network I/O; adapters over core types
- `src/ui/` — display layer; reads core state, emits commands
- `src/cli/` — argument parsing, entry point; wires everything together
```

Flag exceptions: legacy files, transitional hacks, load-bearing oddities.

### 4. Quality gate

What must pass before the LLM considers itself done. Keep it to one command if possible.

```markdown
## Before Finishing

Run `just check` (which runs fmt → lint → test). Zero warnings.
If `just check` doesn't exist yet, run the equivalent steps manually.
```

If warnings require suppression, require a comment explaining why. Without this rule,
dead code accumulates across sessions.

### 5. File-size discipline

Only needed when the codebase has files that are already too large. A concrete table
makes splitting pickable without research.

```markdown
## Large Files

Target: <500 lines per file.

| File            | Lines | Strategy                    |
| --------------- | ----- | --------------------------- |
| src/editor.rs   | 1840  | Split: model / tools / undo |
| src/renderer.rs | 1100  | Extract shader module       |
```

## Optional sections

Add only if they earn their lines.

**Diff discipline.** Useful when the LLM over-refactors:

```markdown
## Diffs

Minimal diffs. Refactor only for: correctness, safety, performance cliffs,
or structural breakage risk. Do not rename, reformat, or reorganise code
outside the current task.
```

**Commit conventions.** If you care about history shape:

```markdown
## Commits

Conventional commits. Scope required. Example: `feat(ui): add layer panel`
```

**Test expectations:**

```markdown
## Tests

New public functions get a test. Bug fixes get a regression test.
Don't mock what you own — use real instances or in-memory fakes.
```

**Links to deeper docs:**

```markdown
## Reference

- Architecture: docs/architecture.md
- Decisions: docs/decisions/
- Backlog: docs/backlog.md
```

## What to leave out

- **Coding style.** The LLM already writes idiomatic code for the language. Specifying
  brace placement wastes budget and patronises the reader.
- **Duplicated docs.** Link, don't copy. Copies drift within a session.
- **Aspirational rules you won't enforce.** Every unenforced rule teaches the LLM to
  discount the whole file.
- **Exhaustive file listings.** State principles and exceptions, not a manifest.

## Litmus test

Can a fresh session read this file in under two minutes and know exactly what it must and
must not do? If yes, it's working.
