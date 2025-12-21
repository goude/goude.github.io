# Development Principles

Code should be calm and intentional. It assumes the reader is intelligent and
busy.

Clarity beats density. Structure is obvious at a glance: imports,
configuration, core logic, boundaries. Names carry meaning so comments are rare
and purposeful.

Functions are small, preconditions handled early, exits explicit, control flow
flat. When revisited months later, the mental model should return quickly
without reverse-engineering intent.

The style is idiomatic without showing off. Language features are used to
simplify thinking, not to demonstrate fluency. Errors are handled deliberately
and close to where recovery or reporting belongs. Logging is a signal tool, not
noise. Comments explain intent, tradeoffs, or constraints—never mechanics.

## Key practices

**Single source of truth**: Version numbers, configuration, and constants live
in one place. TypeScript types and interfaces are defined once and imported
where needed.

**Minimal decisions**: Use opinionated formatters like Prettier and ESLint with
strict configs. Fewer style debates mean more focus on solving problems.

**Consistent task interface**: Every project has a justfile or package.json
scripts with the same core commands—install, dev, check, clean. Each command
gets a single comment line with an emoji stating intent.

**Fast feedback loop**: The check command runs format → lint → typecheck →
build in sequence. Catch errors early, fix them fast.

**Type safety everywhere**: Enable strict TypeScript settings. Prefer explicit
types over inference when it aids understanding. Avoid `any` except in narrow,
documented cases.

**Flat structure**: Avoid deep nesting in code and files. If something needs
three levels of indentation, it probably wants to be extracted. Directory
structure should be scannable—components, utils, types, pages.

**Meaningful names**: Variable and function names should explain purpose
without needing comments. `getUserPreferences()` beats `getData()`.
`isAuthenticated` beats `flag`.

**Error handling up front**: Validate inputs early. Return early on error
conditions. Keep the happy path at the lowest indentation level.

**Comments for why, not what**: The code shows how something works. Comments
explain why this approach was chosen, what tradeoffs were considered, or what
constraints exist.
