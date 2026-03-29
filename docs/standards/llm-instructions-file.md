# What Makes a Good CLAUDE.md

A `CLAUDE.md` file is the contract between you and the AI working in your codebase. It is not documentation. It is operational policy: hard rules, boundaries, and orientation that apply every session without re-stating them.

Keep it under ~200 lines. If it grows beyond that, it has become documentation and nobody will read it — including the AI.

---

## The Four Things It Must Contain

### 1. Lockup Prevention

This is the highest-ROI section. Without it, sessions burn context retrying the same failed operation.

```
## Session Discipline
- Never write >150 lines or edit >50 lines in a single call
- Skeleton first, then append sections via separate edits
- Never retry a timed-out operation identically — restructure instead
- Commit partial work before regenerating
- Respond to interrupts immediately; don't finish buffered work first
```

The skeleton-first rule deserves emphasis: for any file longer than ~100 lines, create the structure (stubs, section headers, empty impls) in one call, then fill each section in subsequent calls. This makes partial failures recoverable.

### 2. Module Boundary Rules

Prose descriptions of architecture drift. A table doesn't.

```
## Import Boundaries

| Module     | Must NOT import from   |
|------------|------------------------|
| renderer   | editor, commands       |
| ui/        | main, renderer         |
| commands   | ui/                    |
```

One table. Enforced by CI if possible (`cargo deny`, custom lint, or a grep in pre-commit). If not enforced by tooling, state that explicitly so the AI knows it's a soft rule vs. a hard one.

### 3. Ownership Map

Not architecture documentation — just a one-liner per file or module saying what it owns. Prevents duplicate logic appearing in two places and tells the AI where new features belong.

```
## Ownership

- `src/renderer.rs`  — pixel buffer → screen; owns no input state
- `src/editor.rs`    — canvas model, tool state, undo stack
- `src/commands.rs`  — discrete undoable operations; no rendering
- `src/ui/`          — menu, cursor, overlays; reads editor, emits commands
```

If a file is an exception to the normal architecture (legacy, transitional, load-bearing hack), say so here.

### 4. File Size Discipline

```
## File Size

Keep files under 1,000 lines. Backlog of current offenders: docs/backlog.md

| File              | Lines | Target | Strategy              |
|-------------------|-------|--------|-----------------------|
| src/editor.rs     | 1,840 | 3 files| Split by concern      |
| src/renderer.rs   | 1,100 | 800    | Extract shader module |
```

A concrete table makes refactoring pickable without research. "Keep files short" is aspirational. "editor.rs is 1,840 lines, split strategy is X" is actionable.

---

## Useful Additions

### Before-Finishing Checklist

Short, enforceable, session-closing ritual:

```
## Before Finishing
- `cargo fmt && cargo check` — zero warnings
- `git fetch origin main && git merge origin/main`
- Resolve conflicts, re-check
- Verify docs still match code
```

### Warning Policy

```
## Warnings
Zero. Fix or suppress with a comment explaining why.
Enforce: `RUSTFLAGS="-D warnings" cargo check`
```

Without this, dead code accumulates silently across sessions.

### Link to Deeper Docs

If architecture, design decisions, or ADRs live elsewhere, link them:

```
## Reference
- Architecture overview: docs/architecture.md
- Current backlog / split plans: docs/backlog.md
- Design decisions: docs/decisions/
```

`CLAUDE.md` is the index. Not the content.

---

## What Not to Include

**Coding style.** The AI already writes idiomatic code. Specifying brace style or naming conventions wastes space and patronises the reader.

**Duplicated architecture docs.** Link, don't copy. Copies drift.

**Aspirational rules.** Only include things you will actually enforce. Every rule you add but don't enforce teaches the AI to discount the whole file.

**Exhaustive file lists.** Ownership principles and exceptions, not a manifest.

---

## Meta-Rule

If you find yourself writing a second paragraph to justify a rule, that rule belongs in `docs/architecture.md`, not here. `CLAUDE.md` states policy. It does not argue for it.

The test: can a new session read this file in under two minutes and know exactly what it must not do? If yes, it's working.
