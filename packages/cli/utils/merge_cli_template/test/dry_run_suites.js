import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import baseIntegrationTests from "../src/write_build/steps/base_integration_tests.js";
import integrationTests from "../src/write_build/steps/integration_tests.js";
import dockerComposeLogs from "../src/write_build/steps/docker_compose_logs.js";
import command from "../src/write_build/command.js";
import commandGateway from "../src/write_build/command_gateway.js";
import eventStore from "../src/write_build/event_store.js";
import fact from "../src/write_build/fact.js";
import factGateway from "../src/write_build/fact_gateway.js";
import job from "../src/write_build/job.js";
import projection from "../src/write_build/projection.js";
import viewComposite from "../src/write_build/view_composite.js";
import viewGateway from "../src/write_build/view_gateway.js";
import viewStore from "../src/write_build/view_store.js";

// The generated shell runs for real, but its PATH holds only the `yarn` and
// `docker` doubles written below and the shells are named by absolute path.
// Nothing here can reach gcloud, Docker, a registry or a real test suite.
//
// Cloud Build substitutes dollars in every arg before the shell sees it, so a
// generated arg may only contain doubled dollars. `unescaped` rejects a bare
// one and then applies the same doubled-to-literal step Cloud Build does.
const shells = { bash: "/bin/bash", sh: "/bin/sh" };
const unescaped = (arg) => {
  assert(!arg.replaceAll("$$", "").includes("$"), `bare dollar in: ${arg}`);
  return arg.replaceAll("$$", () => "$");
};
const baseStatus = ".blossm-dry-run-status-test:base-integration";

describe("Integration suite results in generated builds", function () {
  // Each case spawns real shells, which outrun Mocha's 2s default under load.
  this.timeout(10000);

  let root;
  beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), "blossm-dry-run-"));
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  // Runs steps the way Cloud Build does: in order, in one fresh workspace,
  // stopping at the first step that exits nonzero.
  const build = (
    steps,
    {
      base = 0,
      custom = 0,
      logs = 0,
      prepare = () => {},
      between = () => {},
    } = {},
  ) => {
    const sandbox = mkdtempSync(path.join(root, "build-"));
    const bin = path.join(sandbox, "bin");
    const workspace = path.join(sandbox, "workspace");
    const calls = path.join(sandbox, "calls");
    mkdirSync(bin);
    mkdirSync(workspace);
    prepare(workspace);
    writeFileSync(
      path.join(bin, "yarn"),
      `#!/bin/sh
echo "yarn $*" >> "${calls}"
case "$1" in
  test:base-integration) exit ${base} ;;
  test:integration) exit ${custom} ;;
esac
exit 64
`,
      { mode: 0o755 },
    );
    writeFileSync(
      path.join(bin, "docker"),
      `#!/bin/sh\necho "docker $*" >> "${calls}"\nexit ${logs}\n`,
      { mode: 0o755 },
    );
    let result = { status: 0 };
    let stderr = "";
    for (const [index, step] of steps.entries()) {
      if (index) between(workspace);
      result = spawnSync(
        shells[step.entrypoint] ?? path.join(bin, step.entrypoint),
        step.args.map(unescaped),
        { cwd: workspace, env: { PATH: bin }, encoding: "utf8" },
      );
      assert.equal(result.error, undefined);
      stderr += result.stderr;
      if (result.status !== 0) break;
    }
    return {
      status: result.status,
      stderr,
      calls: existsSync(calls)
        ? readFileSync(calls, "utf8").trim().split("\n")
        : [],
    };
  };

  const both = { runBaseIntegrationTests: true, runIntegrationTests: true };
  const dry = (suites = both) => [
    ...(suites.runBaseIntegrationTests
      ? [baseIntegrationTests({ strict: false })]
      : []),
    ...(suites.runIntegrationTests
      ? [integrationTests({ strict: false })]
      : []),
    dockerComposeLogs(suites),
  ];
  const everyCall = [
    "yarn test:base-integration",
    "yarn test:integration",
    "docker compose logs",
  ];

  it("passes a dry build only when every suite passes", () => {
    const result = build(dry());
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(result.calls, everyCall);
  });

  it("fails a dry build for a base failure after printing logs", () => {
    const result = build(dry({ runBaseIntegrationTests: true }), { base: 3 });
    assert.equal(result.status, 1);
    assert.deepEqual(result.calls, [
      "yarn test:base-integration",
      "docker compose logs",
    ]);
    assert.match(result.stderr, /test:base-integration status: 3/);
  });

  it("fails a dry build for a custom failure after printing logs", () => {
    const result = build(dry({ runIntegrationTests: true }), { custom: 2 });
    assert.equal(result.status, 1);
    assert.deepEqual(result.calls, [
      "yarn test:integration",
      "docker compose logs",
    ]);
    assert.match(result.stderr, /test:integration status: 2/);
  });

  it("keeps an earlier failure when the later suite passes", () => {
    const result = build(dry(), { base: 1 });
    assert.equal(result.status, 1);
    assert.deepEqual(result.calls, everyCall);
    assert.match(result.stderr, /test:base-integration status: 1/);
    assert.doesNotMatch(result.stderr, /test:integration status/);
  });

  it("keeps a later failure when the earlier suite passes", () => {
    const result = build(dry(), { custom: 1 });
    assert.equal(result.status, 1);
    assert.deepEqual(result.calls, everyCall);
    assert.doesNotMatch(result.stderr, /test:base-integration status/);
    assert.match(result.stderr, /test:integration status: 1/);
  });

  it("reports the test failure even when printing logs also fails", () => {
    const result = build(dry(), { base: 5, logs: 9 });
    assert.equal(result.status, 1);
    assert.deepEqual(result.calls, everyCall);
    assert.match(result.stderr, /test:base-integration status: 5/);
  });

  it("fails a dry build whose passing suites could not print logs", () => {
    const result = build(dry(), { logs: 9 });
    assert.equal(result.status, 9);
    assert.equal(result.stderr, "");
  });

  it("fails the suite step itself when its status cannot be recorded", () => {
    // A directory at the reserved path makes the write fail.
    const result = build(dry(), {
      prepare: (workspace) => mkdirSync(path.join(workspace, baseStatus)),
    });
    assert.notEqual(result.status, 0);
    assert.deepEqual(result.calls, ["yarn test:base-integration"]);
  });

  it("fails closed when an expected result is absent, empty or unreadable", () => {
    for (const [name, spoil] of [
      ["absent", (file) => rmSync(file)],
      ["empty", (file) => writeFileSync(file, "")],
      ["not a status", (file) => writeFileSync(file, "00\n")],
      [
        "unreadable",
        (file) => {
          rmSync(file);
          mkdirSync(file);
        },
      ],
    ]) {
      const result = build(dry({ runBaseIntegrationTests: true }), {
        between: (workspace) => spoil(path.join(workspace, baseStatus)),
      });
      assert.equal(result.status, 1, name);
      assert.deepEqual(
        result.calls,
        ["yarn test:base-integration", "docker compose logs"],
        name,
      );
      assert.match(
        result.stderr,
        /Dry run failed: test:base-integration/,
        name,
      );
    }
    // A log step run without the suite it expects has no result to accept.
    const result = build([dockerComposeLogs(both)]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /test:base-integration status: missing/);
    assert.match(result.stderr, /test:integration status: missing/);
  });

  it("escapes every shell dollar for Cloud Build substitution", () => {
    const shell = dry().map((step) => step.args.at(-1));
    for (const script of shell) unescaped(script);
    // The doubles are what Cloud Build turns back into the shell's own.
    assert(shell[0].includes('echo "$$?" >'));
    for (const name of ["$$status", "$$failed", "$$logs", "logs=$$?"])
      assert(shell.at(-1).includes(name), name);
    assert.throws(() => unescaped('echo "$?"'), /bare dollar/);
    assert.throws(() => unescaped('echo "$$$status"'), /bare dollar/);
  });

  it("only prints logs when a dry build runs no integration suite", () => {
    assert.equal(build(dry({})).status, 0);
    assert.equal(build(dry({}), { logs: 4 }).status, 4);
  });

  it("stops a strict build at the first failing suite", () => {
    const deploy = { entrypoint: "docker", args: ["push"] };
    const strict = [baseIntegrationTests(), integrationTests(), deploy];
    for (const step of strict.slice(0, 2))
      assert.equal(step.entrypoint, "yarn");

    let result = build(strict, { base: 6 });
    assert.equal(result.status, 6);
    assert.deepEqual(result.calls, ["yarn test:base-integration"]);

    result = build(strict, { custom: 7 });
    assert.equal(result.status, 7);
    assert.deepEqual(result.calls, [
      "yarn test:base-integration",
      "yarn test:integration",
    ]);

    result = build(strict);
    assert.equal(result.status, 0);
    assert.deepEqual(result.calls.at(-1), "docker push");
  });

  // Every procedure builder shares the same generators and the same log gate.
  const builders = {
    command,
    commandGateway,
    eventStore,
    fact,
    factGateway,
    job,
    projection,
    viewComposite,
    viewGateway,
    viewStore,
  };
  const generate = (builder, options) =>
    builder({ actions: [], events: [], ...options }).flat();
  const serialized = (steps) => JSON.stringify(steps);

  for (const [name, builder] of Object.entries(builders)) {
    it(`ends the ${name} dry build with the gate for the suites it ran`, () => {
      for (const suites of [
        both,
        { runBaseIntegrationTests: true },
        { runIntegrationTests: true },
        {},
      ]) {
        const steps = generate(builder, { ...suites, strict: false });
        // Exactly the recording suite steps, in order, then the gate last.
        assert.deepEqual(
          steps
            .slice(0, -1)
            .filter((step) => serialized(step).includes("integration")),
          dry(suites).slice(0, -1),
        );
        assert.deepEqual(steps.at(-1), dockerComposeLogs(suites));
      }
    });

    it(`keeps ${name} deployment behind directly failing suites`, () => {
      const steps = generate(builder, { ...both, strict: true });
      const position = (step) =>
        steps.findIndex(
          (candidate) => serialized(candidate) == serialized(step),
        );
      const base = position(baseIntegrationTests());
      const custom = position(integrationTests());
      const push = steps.findIndex((step) => step.args?.includes("push"));
      assert(base >= 0 && base < custom && custom < push, name);
      assert(!serialized(steps).includes("blossm-dry-run-status"));
    });
  }
});
