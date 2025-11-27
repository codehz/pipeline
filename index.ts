/**
 * A minimal, strongly-typed pipeline builder.
 *
 * Usage
 *   const fn = pipeline<{input: number}>()
 *     .addPass(env => ({output: env.input + 1}))
 *     .addPass(env => ({log: `${env.input} => ${env.output}`}))
 *     .build();
 *
 *   const result = fn({ input: 1 });
 *   // result: { input: number; output: number; log: string }
 */

type PlainObject = Record<string | number | symbol, unknown>;

type Thenable<T> = {
  then: (
    onfulfilled: (value: T) => any,
    onrejected?: (error: any) => any
  ) => any;
};
type MaybePromise<T> = T | Thenable<T>;

/** A synchronous pass: `run` returns a concrete value. */
export interface SyncPass<Env = void, Ret = void> {
  run(input: Env): Ret;
}

/** An asynchronous pass: `run` returns a thenable/Promise. */
export interface AsyncPass<Env = void, Ret = void> {
  run(input: Env): Thenable<Ret>;
}

// Alias: a `Pass` may be synchronous or asynchronous.
export type Pass<Env = void, Ret = void> =
  | SyncPass<Env, Ret>
  | AsyncPass<Env, Ret>;

export class PipelineBuilder<
  Input extends PlainObject,
  Env extends PlainObject = Input,
  Async extends true | false = false
> {
  // Phantom field that ties the `Async` generic to this class type so
  // PipelineBuilder<..., true> and PipelineBuilder<..., false> are
  // not structurally compatible. It has no runtime effect.
  private readonly __asyncBrand?: Async;

  private passes: Array<
    (env: PlainObject) => MaybePromise<PlainObject | void>
  > = [];

  /**
   * A pass may be provided either as a function `(env) => newFields` or as an
   * object implementing `Pass<Env, Ret>` which provides a `run(env)` method.
   * The returned object's type will be merged into the environment for subsequent passes.
   */
  addPass<
    NewFields extends PlainObject | void,
    Ret extends MaybePromise<NewFields> = MaybePromise<NewFields>
  >(
    fn:
      | ((env: Env) => Ret)
      | SyncPass<Env, Ret>
      | AsyncPass<Env, Ret>
      | SyncPass<void, Ret>
      | AsyncPass<void, Ret>
  ): PipelineBuilder<
    Input,
    Env & (Awaited<Ret> extends void ? {} : Awaited<Ret>),
    Async extends true ? true : Ret extends Thenable<any> ? true : false
  > {
    // Store a wrapper that accepts either a function or an object
    // implementing `run(env)` and returns a (maybe) thenable.
    const wrapper = (env: PlainObject) => {
      if (typeof fn === "function")
        return (fn as (env: Env) => Ret)(
          env as Env
        ) as MaybePromise<PlainObject | void>;
      const maybeObj = fn as Pass<Env, Ret>;
      if (maybeObj && typeof (maybeObj as any).run === "function")
        return (maybeObj as any).run(
          env as Env
        ) as MaybePromise<PlainObject | void>;
      // Throw if the provided value is neither a function nor a pass.
      throw new TypeError(
        "addPass expects a function or an object with a run(env) method"
      );
    };

    this.passes.push(
      wrapper as (env: PlainObject) => MaybePromise<PlainObject | void>
    );
    return this as unknown as PipelineBuilder<
      Input,
      Env & (Awaited<Ret> extends void ? {} : Awaited<Ret>),
      Async extends true ? true : Ret extends Thenable<any> ? true : false
    >;
  }

  /**
   * Finalize the pipeline and return a function that executes the passes sequentially.
   */
  // Overloads: if builder is async at compile time, build() returns an
  // async function; otherwise a sync function. Implementation detects
  // thenables at runtime and switches to Promise-based execution when needed.
  build(
    this: PipelineBuilder<Input, Env, false>
  ): {} extends Input ? (input?: Input) => Env : (input: Input) => Env;
  build(
    this: PipelineBuilder<Input, Env, true>
  ): {} extends Input
    ? (input?: Input) => Promise<Env>
    : (input: Input) => Promise<Env>;
  build(
    this: PipelineBuilder<Input, Env, boolean>
  ): {} extends Input
    ? (input?: Input) => Env | Promise<Env>
    : (input: Input) => Env | Promise<Env>;
  build(): (input?: any) => Env | Promise<Env> {
    const passes = this.passes.slice();

    // Detects thenables/Promises by checking a `.then` function.
    const isThenable = (v: any): v is Promise<any> | { then: Function } =>
      !!v &&
      (typeof v === "object" || typeof v === "function") &&
      typeof v.then === "function";

    return (input?: any) => {
      let env: PlainObject = { ...(input || {}) };

      for (let i = 0; i < passes.length; i++) {
        const pass = passes[i]!;
        const out = pass(env as Env);

        if (isThenable(out)) {
          // Switch to async processing: resolve the current thenable
          // then run remaining passes sequentially (they may also be thenable).
          const remaining = passes.slice(i + 1);

          return Promise.resolve(out).then((resolvedOut) => {
            env = { ...env, ...(resolvedOut || {}) };

            // Chain remaining passes sequentially, merging results into env.
            return remaining
              .reduce<Promise<PlainObject>>((p, next) => {
                return p.then((_env) => {
                  const maybe = next(_env as Env);
                  return Promise.resolve(maybe).then((r) => ({
                    ..._env,
                    ...(r || {}),
                  }));
                });
              }, Promise.resolve(env))
              .then((finalEnv) => finalEnv as Env);
          });
        }

        env = { ...env, ...(out || {}) };
      }

      // All passes completed synchronously.
      return env as Env;
    };
  }
}

/**
 * Factory helper — prefer `pipeline` (short) or `createPipeline` (explicit).
 */
export function pipeline<Input extends PlainObject = {}>() {
  return new PipelineBuilder<Input, Input>();
}

export const createPipeline = pipeline;
