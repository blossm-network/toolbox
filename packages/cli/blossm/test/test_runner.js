import assert from "assert";
import path from "path";
import { load } from "./load.js";
import { deployment } from "./deploy.js";
import processDeps from "../../utils/test_cli_template/deps.js";

const fixture = async ({ installed = true, fail, execute } = {}) => {
  const calls = [];
  const run = await load("utils/test_cli_template/index.js", {
    roboSay: (value) => value,
    chalk: { red: { bold: (value) => value } },
    process: { stdin: {}, stdout: {}, stderr: {}, cwd: () => "/source" },
    console: { error: () => {} },
    path,
    fs: {
      existsSync: (target) => !target.endsWith("yarn.lock") || installed,
      copyFileSync: () => {},
      removeSync: () => {},
      mkdirSync: () => {},
      copy: async () => {},
    },
    deps: {
      execFileSync: (command, args, options) => {
        calls.push({ command, args, options });
        if (execute) return execute(command, args, options);
        if (fail && fail(args)) throw new Error("subprocess failed");
      },
    },
  });
  return {
    run: () => run({ workingDir: "/build", input: { path: "." } }),
    calls,
  };
};

describe("CLI local test runner", () => {
  it("fails immediately when installation fails", async () => {
    const test = await fixture({ installed: false, fail: () => true });
    await assert.rejects(test.run(), /subprocess failed/);
    assert.deepStrictEqual(
      test.calls.map(({ args }) => args),
      [[]]
    );
  });
  it("fails when either inherited-stdio unit-test subprocess fails", async () => {
    for (const suite of ["test:base-unit", "test:unit"]) {
      const test = await fixture({ fail: (args) => args[0] === suite });
      await assert.rejects(test.run(), /subprocess failed/);
      assert.strictEqual(test.calls.at(-1).args[0], suite);
    }
  });
  it("propagates a real failed test through deployment without reporting success", async () => {
    const test = await fixture({
      execute: () =>
        processDeps.execFileSync(process.execPath, ["-e", "process.exit(7)"], {
          stdio: "inherit",
        }),
    });
    const deploy = await deployment({
      input: { unitTest: true },
      testCliTemplate: test.run,
    });
    await assert.rejects(deploy.run(), (error) => error.status === 7);
    assert.strictEqual(test.calls.length, 1);
    assert.strictEqual(test.calls[0].args[0], "test:base-unit");
    assert(!deploy.logs.some((args) => args.includes("done")));
    assert.deepStrictEqual(deploy.removed, ["/fixture/build"]);
  });
  it("runs both suites when their subprocesses succeed", async () => {
    for (const installed of [true, false]) {
      const test = await fixture({ installed });
      await test.run();
      assert.deepStrictEqual(
        test.calls.map(({ args }) => args),
        [...(installed ? [] : [[]]), ["test:base-unit"], ["test:unit"]]
      );
    }
  });
});
