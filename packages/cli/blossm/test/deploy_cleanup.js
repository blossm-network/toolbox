import assert from "assert";
import path from "path";
import { load } from "./load.js";

const identity = (value) => value;
const chalk = { green: { bold: identity }, red: { bold: identity } };

export const deployment = async ({
  input = {},
  spawnSync = () => ({ status: 0 }),
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
    spawnSync,
    execFileSync: () => {},
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
  it("preserves the caller's dependencies and lockfile even during dry-run", async () => {
    for (const dryRun of [false, true]) {
      const fixture = await deployment({ input: { dryRun, path: "nested" } });
      await fixture.run();
      assert.deepStrictEqual(fixture.removed, ["/fixture/build"]);
    }
  });

});
