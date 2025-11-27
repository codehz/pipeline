import { describe, expect, it } from "bun:test";
import { pipeline, type SyncPass } from "../index";

describe("pipeline builder", () => {
  it("merges passes and preserves typing at runtime", () => {
    const fn = pipeline<{ input: number }>()
      .addPass((env) => ({ output: env.input + 1 }))
      .addPass((env) => ({ log: `${env.input} => ${env.output}` }))
      .build();

    const out = fn({ input: 1 });

    expect(out.input).toBe(1);
    expect(out.output).toBe(2);
    expect(out.log).toBe("1 => 2");
  });

  it("supports multiple fields and ordering", () => {
    const fn = pipeline<{ a: number; b?: number }>()
      .addPass((env) => ({ b: (env.b ?? 0) + env.a }))
      .addPass((env) => ({ c: env.a + env.b }))
      .build();

    const res = fn({ a: 3 });

    expect(res.a).toBe(3);
    expect(res.b).toBe(3);
    expect((res as any).c).toBe(6);
  });

  it("returns async when a pass returns a Promise", async () => {
    const fn = pipeline<{ input: number }>()
      .addPass(async (env) => ({ output: env.input + 1 }))
      .addPass(async (env) => ({ log: `${env.input} => ${env.output}` }))
      .build();

    const maybe = fn({ input: 2 });
    // runtime should be a Promise
    expect(maybe).toBeInstanceOf(Promise);

    const res = await maybe;
    expect(res.input).toBe(2);
    expect(res.output).toBe(3);
    expect(res.log).toBe("2 => 3");
  });

  it("switches to async when a pass returns thenable at runtime", async () => {
    const thenable = <T>(val: T) => ({
      then: (resolve: (value: T) => void) => resolve(val),
    });

    const fn = pipeline<{ input: number }>()
      .addPass((env) => thenable({ output: env.input + 10 }))
      .addPass((env) => ({ log: `${env.input} => ${env.output}` }))
      .build();

    const maybe = fn({ input: 5 });
    expect(maybe).toBeInstanceOf(Promise);

    const res = await maybe;
    expect(res.input).toBe(5);
    expect(res.output).toBe(15);
    expect(res.log).toBe("5 => 15");
  });

  it("supports pass objects with a run() method (sync)", () => {
    const incPass = {
      run: (env: any) => ({ output: env.input + 7 }),
    };

    const logPass = {
      run: (env: any) => ({ log: `${env.input} => ${env.output}` }),
    };

    const fn = pipeline<{ input: number }>()
      .addPass(incPass)
      .addPass(logPass)
      .build();

    const out = fn({ input: 4 });
    expect((out as any).output).toBe(11);
    expect((out as any).log).toBe("4 => 11");
  });

  it("supports pass objects whose run() returns thenables (async)", async () => {
    const thenable = <T>(val: T) => ({
      then: (resolve: (v: T) => void) => resolve(val),
    });

    const incPass = {
      run: (env: any) => thenable({ output: env.input + 20 }),
    };

    const logPass = {
      run: (env: any) => ({ log: `${env.input} => ${env.output}` }),
    };

    const fn = pipeline<{ input: number }>()
      .addPass(incPass)
      .addPass(logPass)
      .build();

    const maybe = fn({ input: 1 });
    expect(maybe).toBeInstanceOf(Promise);

    const res = await maybe;
    expect(res.input).toBe(1);
    expect(res.output).toBe(21);
    expect(res.log).toBe("1 => 21");
  });

  it("supports void return type (no new fields)", () => {
    const fn = pipeline<{ a: number }>()
      .addPass((env): void => {
        // side effect or no-op
        return;
      })
      .build();

    const res = fn({ a: 1 });
    expect(res).toEqual({ a: 1 });
  });

  it("supports void input type in object pass", () => {
    const voidPass: SyncPass<void, void> = {
      run() {
        // no-op
      }
    };

    const fn = pipeline<{ a: number }>()
      .addPass(voidPass)
      .build();

    const res = fn({ a: 1 });
    expect(res).toEqual({ a: 1 });
  });

  it("allows calling without arguments for empty input", () => {
    const fn = pipeline<{}>()
      .addPass(() => ({ output: 1 }))
      .build();

    const res = fn();
    expect(res.output).toBe(1);
  });

  it("allows calling without arguments for optional input", () => {
    const fn = pipeline<{ a?: number }>()
      .addPass((env) => ({ output: (env.a || 0) + 1 }))
      .build();

    const res = fn();
    expect(res.output).toBe(1);
  });

  it("allows calling without arguments for default input", () => {
    const fn = pipeline() // default Input is {}
      .addPass(() => ({ output: 1 }))
      .build();

    const res = fn();
    expect(res.output).toBe(1);
  });
});
