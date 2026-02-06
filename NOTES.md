# NOTES.md

This file is an ad-hoc, lightweight companion to `README.md`.

Its purpose is to help a future reader (often future-you) quickly understand _local intent_ in this directory: why things look the way they do, what was tried, and what should not be “cleaned up” without thought.

Think of it as a **working memory**, not a polished document.

Typical contents:

- **Context**: why this directory exists; what problem it solves.
- **Design decisions**: choices that are non-obvious, controversial, or constrained by external factors.
- **Assumptions & invariants**: things the code relies on being true.
- **Trade-offs**: what was deliberately _not_ done, and why.
- **Gotchas**: sharp edges, surprising behavior, things that bit you once.
- **Experiments**: ideas tried and abandoned (briefly), so they’re not retried blindly.
- **Future work**: thoughts, TODOs, or questions worth revisiting.

Non-goals:

- Not a full API reference.
- Not a changelog.
- Not marketing or onboarding material.

Tone:

- Brief, honest, informal.
- Written for humans, not tooling.
- Allowed to be partial, speculative, or time-stamped.

Rule of thumb:

> If removing this file would make a future you mutter “why on earth is this like this?”, it belongs here.

Update it when you learn something that isn’t obvious from the code.
Delete entries when they stop being true.
