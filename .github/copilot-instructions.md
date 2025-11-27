<!-- .github/copilot-instructions.md for @codehz/pipeline -->
# Quick orientation for code-writing agents

This repository is a tiny TypeScript-first utility (no build artifact required). The source is in `index.ts` and the tests are in `test/index.test.ts`.

Key points an agent should know before making edits:

- Entry point: `index.ts` — this file *is* the library. Changes here are the public API.
- Tests: `test/index.test.ts` — Bun test runner style (`import { describe, it, expect } from "bun:test"`). Use this file as the canonical examples for behavior and edge cases.
- No transpilation step in CI: the project expects TypeScript sources to be runnable (Bun recommended). `package.json` uses `bun test` for the `test` script.

Important project-specific patterns and constraints
- TypeScript-first API design: generics drive precise typing (see `PipelineBuilder<Input, Env, Async>` in `index.ts`). Preserve typings in any refactor.
- Passes accept either a plain function `(env) => newFields` or an object with `run(env)`; both sync and thenable return values are supported. Tests cover both patterns — reference `thenable` helpers in `test/index.test.ts`.
- Runtime async detection: if any pass returns a thenable (object with a `.then` function) *at runtime*, the pipeline switches to Promise-mode. Maintain that behavior and tests when changing control flow.
- Merge semantics: returned objects from passes are shallow-merged into the environment for subsequent passes. Keep merges shallow and predictable.

Commands and developer workflow
- Install: `bun install` (recommended). Alternatives: `npm install` or `yarn install`.
- Run tests: `bun test` (see `package.json`). Tests are plain TS files importing from `index.ts`.

When writing code or fixes
- Be conservative with changes to generics or public API shape; update test coverage in `test/index.test.ts` for any behavioral changes.
- Add tests that mirror the existing style (Bun test runner), including sync, async (async/await), and thenable-based passes.
- Use concrete examples from the codebase when creating or modifying tests — e.g., `pipeline<{input:number}>().addPass(...).build()` and `thenable` helpers.

Examples agents can use as references
- Sync pass example: see `test/index.test.ts` first test — merging fields and preserving types.
- Async/thenable example: see tests that return `async` passes and tests that use a small `thenable()` helper.

Safety and scope guidance
- This repo is intentionally small — avoid adding heavy dependencies. Keep changes lightweight and well-covered by tests.
- Prefer explicit and minimal modifications to `index.ts` — because it's the single-file implementation, large refactors require extra tests and careful typing checks.

If you need further clarification, ask for: which public surface must be preserved, or whether you can rework `index.ts` into multiple modules for readability.
