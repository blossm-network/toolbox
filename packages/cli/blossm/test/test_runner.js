import assert from "assert";
import path from "path";
import { load } from "./load.js";

const fixture = async ({ installed = true, fail } = {}) => {
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
    execFileSync: (command, args, options) => {
      calls.push({ command, args, options });
      if (fail && fail(args)) throw new Error("subprocess failed");
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
  it("runs both suites when their subprocesses succeed", async () => {
    const test = await fixture();
    await test.run();
    assert.deepStrictEqual(
      test.calls.map(({ args }) => args),
      [["test:base-unit"], ["test:unit"]]
    );
  });
});
