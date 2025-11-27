
# pipeline — tiny TypeScript pipeline builder

A compact, strongly-typed, builder-style pipeline utility for TypeScript. It lets you build a sequence of transformation "passes" that merge fields into a shared environment object. The builder is smart about synchronous vs asynchronous passes — if any pass returns a Promise/thenable at runtime, the final pipeline switches to async behavior.

⚡️ Small, zero-deps, TypeScript-first utility designed for composable transforms.

---

## Features

- Statically typed pipeline builder with incremental environment merging
- Supports synchronous and asynchronous passes (switches to Promise at runtime)
- Accepts both functions and objects implementing `run(env)` as passes
- Tiny, well-documented, and easy to drop into TypeScript projects

---

## Quick example

```ts
import { pipeline } from "@codehz/pipeline"; // or relative import

const fn = pipeline<{ input: number }>()
	.addPass((env) => ({ output: env.input + 1 }))
	.addPass((env) => ({ log: `${env.input} => ${env.output}` }))
	.build();

const res = fn({ input: 1 });

// res has inferred type: { input: number; output: number; log: string }
console.log(res);
```

This will run synchronously and print a merged environment object.

If a pass returns a Promise/thenable at runtime, the returned value from the built pipeline will be a Promise that resolves to the final environment.

---

## API overview

- `pipeline<Input>()` — factory that returns a `PipelineBuilder` instance.
- `PipelineBuilder.addPass(fn | { run(env) })` — append a pass. The values returned from the pass are merged into the pipeline's environment and are available to subsequent passes.
- `PipelineBuilder.build()` — finalize and retrieve the runner function. The runtime result will be synchronous or Promise-based depending on the passes.

---

## Installation

This repository uses Bun for tests in the included `package.json`. You can use Bun or any package manager you prefer for installation and running tests.

Using Bun (recommended for local dev here):

```bash
bun install
```

If you prefer npm / yarn:

```bash
npm install
# or
yarn install
```

Note: TypeScript is a peer dependency (this project targets TypeScript v5+).

---

## Running tests

The repository's tests use Bun’s test runner. Run the tests with:

```bash
bun test
```

If you don't have Bun installed you can still run tests with a different test runner — the codebase uses plain TypeScript/JS and the tests are simple and self-contained.

---

## Contributing

Contributions are welcome — open an issue or PR for improvements, additional helpers, or new features. Keep changes small and add tests for new behavior.

---

## License

This project is licensed under the terms in the repository (see LICENSE).

