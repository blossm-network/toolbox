import assert from "assert";
import path from "path";
import { load } from "./load.js";

const identity = (value) => value;
const chalk = { green: { bold: identity }, red: { bold: identity } };

export const deployment = async ({
  input = {},
  execFileSync = () => {},
} = {}) => {
  const removed = [];
  const logs = [];
  const deploy = await load("utils/deploy_cli_template/index.js", {
    normalize: async () => ({ env: "development", path: ".", ...input }),
    roboSay: identity,
    mergeCliTemplate: async () => {},
    testCliTemplate: async () => {},
    fs: {
      mkdtempSync: () => "/fixture/build",
      removeSync: (target) => removed.push(target),
    },
    execFileSync,
    rootDir: {
      config: () => ({
        vendors: { cloud: { gcp: { projects: { development: "test" } } } },
      }),
    },
    path,
    chalk,
    os: { tmpdir: () => "/fixture" },
    process: { cwd: () => "/caller", stdin: {}, stdout: {}, stderr: {} },
    console: { log: (...args) => logs.push(args) },
  });
  return {
    run: () => deploy({ domain: "command", dir: "/templates" })([], () => ({})),
    removed,
    logs,
  };
};

describe("CLI deployment result", () => {
  it("propagates nonzero exit, launch and signal failures", async () => {
    for (const details of [
      { status: 1 },
      { code: "ENOENT" },
      { signal: "SIGTERM" },
    ]) {
      const failure = Object.assign(new Error("build failed"), details);
      const fixture = await deployment({
        execFileSync: () => {
          throw failure;
        },
      });
      await assert.rejects(fixture.run(), (err) => err === failure);
      assert(!fixture.logs.some((args) => args.includes("done")));
      assert(fixture.removed.includes("/fixture/build"));
    }
  });
  it("reports success only when build completes successfully", async () => {
    const calls = [];
    const fixture = await deployment({
      execFileSync: (...args) => calls.push(args),
    });
    await fixture.run();
    assert.strictEqual(calls[0][0], "gcloud");
    assert(fixture.logs.some((args) => args.includes("done")));
  });
});
