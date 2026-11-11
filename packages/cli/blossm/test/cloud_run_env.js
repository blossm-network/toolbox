import assert from "assert";
import fs from "fs";
import path from "path";
import yaml from "yaml";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import writeBuild from "../../utils/merge_cli_template/src/write_build/index.js";
import { load } from "./load.js";

const buildDir = "utils/merge_cli_template/src/write_build";
const writer = async () => {
  const runtimeUrl = new URL(
    "../../utils/merge_cli_template/runtime.js",
    import.meta.url,
  );
  return load(
    `${buildDir}/steps/write_env.js`,
    fs.existsSync(runtimeUrl) ? await import(runtimeUrl) : {},
  );
};

describe("Cloud Run environment file generation", () => {
  for (const procedure of [
    "command",
    "fact",
    "job",
    "projection",
    "event-store",
    "view-store",
    "view-composite",
    "command-gateway",
    "view-gateway",
    "fact-gateway",
  ]) {
    it(`writes an ordered environment file for the actual ${procedure} build`, () => {
      const directory = fs.mkdtempSync(
        path.join(tmpdir(), "blossm-cloud-run-"),
      );
      try {
        for (const strict of [false, true]) {
          writeBuild({
            workingDir: directory,
            procedure,
            strict,
            actions: [],
            events: [],
            name: "read",
            domain: "account",
            service: "core",
            context: "tenant",
            region: "us-central1",
            network: "example.test",
            env: "production",
            operationName: "operation",
            operationHash: "hash",
            dependencyKeyEnvironmentVariables: {
              DEPENDENCY_KEY: "a,b=c\nnext $value",
            },
          });
          const { steps } = yaml.parse(
            fs.readFileSync(path.join(directory, "build.yaml"), "utf8"),
          );
          assert(steps.every((step) => !Array.isArray(step)));
          const deployIndex = steps.findIndex((step) =>
            step.args?.includes("deploy"),
          );
          assert.strictEqual(deployIndex >= 0, strict);
          if (!strict) continue;
          const prepare = steps[deployIndex - 1];
          assert.strictEqual(prepare.entrypoint, "node");
          execFileSync(process.execPath, prepare.args, { cwd: directory });
          const variables = JSON.parse(
            fs.readFileSync(
              path.join(directory, ".blossm-cloud-run-env.json"),
              "utf8",
            ),
          );
          assert.strictEqual(variables.PROCEDURE, procedure);
          assert.strictEqual(variables.OPERATION_HASH, "hash");
          assert.strictEqual(variables.DEPENDENCY_KEY, "a,b=c\nnext $value");
          assert(
            steps[deployIndex].args.includes(
              "--env-vars-file=.blossm-cloud-run-env.json",
            ),
          );
        }
        const ignore = fs.readFileSync(
          new URL(
            "../../utils/merge_cli_template/template/.dockerignore",
            import.meta.url,
          ),
          "utf8",
        );
        assert(ignore.split(/\r?\n/).includes(".blossm-cloud-run-env.json"));
      } finally {
        fs.rmSync(directory, { recursive: true, force: true });
      }
    });
  }

  it("preserves literal commas, equals, dollars, quotes, backticks and newlines", async () => {
    const writeEnv = await writer();
    const deployRun = await load(`${buildDir}/steps/deploy_run.js`, {
      writeEnv,
    });
    const value =
      'a,b=c $VAR $(touch marker) `touch marker` "quoted"\nline two';
    const [prepare, deploy] = deployRun({
      env: {
        DATA: value,
        EMPTY: "",
        ZERO: 0,
        FALSE: false,
        NULL: null,
        UNDEFINED: undefined,
      },
      procedure: "command",
      operationHash: "hash",
      labels: { service: "team" },
    });
    assert.strictEqual(prepare.entrypoint, "node");
    assert(deploy.args.includes("--env-vars-file=.blossm-cloud-run-env.json"));
    assert(!deploy.args.some((arg) => arg.startsWith("--set-env-vars=")));
    assert(!deploy.args.some((arg) => arg.includes(value)));
    assert(
      deploy.args.includes(
        "--labels=procedure=command,hash=hash,service=team,",
      ),
    );
    let target;
    let bytes;
    new Function("require", "process", "Buffer", prepare.args[1])(
      (name) => {
        assert.strictEqual(name, "fs");
        return {
          writeFileSync: (filename, data) => {
            target = filename;
            bytes = data;
          },
        };
      },
      { argv: ["node", prepare.args[2]] },
      Buffer,
    );
    assert.strictEqual(target, ".blossm-cloud-run-env.json");
    const data = JSON.parse(bytes.toString());
    assert.deepStrictEqual(yaml.parse(bytes.toString()), data);
    assert.strictEqual(data.DATA, value);
    assert.strictEqual(data.EMPTY, "");
    assert.strictEqual(data.ZERO, "0");
    assert.strictEqual(data.FALSE, "false");
    assert.strictEqual(data.NULL, "null");
    assert.strictEqual(data.UNDEFINED, "undefined");
    assert(Object.values(data).every((entry) => typeof entry === "string"));
    assert(!Object.hasOwn(data, "MAIN_CONTAINER_NAME"));
    assert(!prepare.args[2].includes("$"));
  });
  it("flattens preparation and deployment steps in the generated build order", async () => {
    const writeEnv = await writer();
    const deployRun = await load(`${buildDir}/steps/deploy_run.js`, {
      writeEnv,
    });
    const [prepare, deploy] = deployRun({
      procedure: "command",
      env: { DATA: "literal" },
    });
    let output;
    const writeBuild = await load(`${buildDir}/index.js`, {
      path,
      fs: {
        existsSync: () => false,
        writeFileSync: (_, build) => {
          output = build;
        },
      },
      yaml: { stringify: (value) => value },
      command: () => [{ name: "before" }, [prepare, deploy], { name: "after" }],
    });
    writeBuild({
      workingDir: "/fixture",
      procedure: "command",
      name: "run",
      domain: "bird",
      service: "animals",
    });
    assert.deepStrictEqual(output.steps, [
      { name: "before" },
      prepare,
      deploy,
      { name: "after" },
    ]);
    assert(output.steps.every((step) => !Array.isArray(step)));
  });
});
