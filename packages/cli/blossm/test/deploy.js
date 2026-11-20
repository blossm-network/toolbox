import assert from "assert";
import path from "path";
import { load } from "./load.js";
import processDeps from "../../utils/deploy_cli_template/deps.js";

const identity = (value) => value;
const chalk = { green: { bold: identity }, red: { bold: identity } };
const stdio = { stdin: {}, stdout: {}, stderr: {} };

export const deployment = async ({
  input = {},
  execFileSync = () => {},
  testCliTemplate = async () => {},
  ensureRuntimeIdentity = () => {},
} = {}) => {
  const removed = [];
  const logs = [];
  const deploy = await load("utils/deploy_cli_template/index.js", {
    normalize: async () => ({ env: "development", path: ".", ...input }),
    roboSay: identity,
    mergeCliTemplate: async () => {},
    testCliTemplate,
    fs: {
      mkdtempSync: () => "/fixture/build",
      removeSync: (target) => removed.push(target),
    },
    deps: { execFileSync },
    ensureRuntimeIdentity,
    rootDir: {
      config: () => ({
        vendors: { cloud: { gcp: { projects: { development: "test" } } } },
      }),
    },
    path,
    chalk,
    os: { tmpdir: () => "/fixture" },
    process: { cwd: () => "/caller", ...stdio },
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
  it("propagates an actual native subprocess nonzero exit", async () => {
    const fixture = await deployment({
      execFileSync: () =>
        processDeps.execFileSync(process.execPath, ["-e", "process.exit(7)"], {
          stdio: "ignore",
        }),
    });
    await assert.rejects(fixture.run(), (error) => error.status === 7);
    assert(!fixture.logs.some((args) => args.includes("done")));
    assert(fixture.removed.includes("/fixture/build"));
  });
  it("reports success only when build completes successfully", async () => {
    const calls = [];
    const fixture = await deployment({
      execFileSync: (...args) => calls.push(args),
    });
    await fixture.run();
    // Only the beta track streams a CLOUD_LOGGING_ONLY build to the terminal.
    assert.deepStrictEqual(calls, [
      [
        "gcloud",
        [
          "beta",
          "builds",
          "submit",
          ".",
          "--config=build.yaml",
          "--project=test",
        ],
        {
          stdio: [stdio.stdin, stdio.stdout, stdio.stderr],
          cwd: "/fixture/build",
        },
      ],
    ]);
    assert.deepStrictEqual(fixture.removed, ["/fixture/build"]);
    assert(fixture.logs.some((args) => args.includes("done")));
  });
  it("ensures the runtime identity before submitting and reports a new one", async () => {
    const order = [];
    const fixture = await deployment({
      execFileSync: () => order.push("submit"),
      ensureRuntimeIdentity: ({ workingDir, project, execFileSync }) => {
        assert.deepStrictEqual(
          [workingDir, project],
          ["/fixture/build", "test"],
        );
        assert.equal(typeof execFileSync, "function");
        order.push("identity");
        return "start@test.iam.gserviceaccount.com";
      },
    });
    await fixture.run();
    assert.deepStrictEqual(order, ["identity", "submit"]);
    assert(
      fixture.logs.some(([line]) =>
        line.includes("start@test.iam.gserviceaccount.com"),
      ),
    );
  });
});
