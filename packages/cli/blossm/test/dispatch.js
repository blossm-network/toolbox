import assert from "assert";
import { load, cliDir } from "./load.js";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";

const fixture = async (domain, operation, { configFailure } = {}) => {
  const deps = Object.fromEntries(
    [
      "init",
      "secret",
      "queue",
      "command",
      "projection",
      "eventStore",
      "viewStore",
      "commandGateway",
      "viewGateway",
      "factGateway",
      "roles",
      "job",
      "fact",
      "viewComposite",
    ].map((name) => [name, operation]),
  );
  return load(
    "blossm/src/index.js",
    {
      ...deps,
      chalk: { red: { bold: (value) => value } },
      normalize: async () => ({ domain, args: [], positionalArgs: [] }),
      fs: {
        readFileSync: () => {
          if (configFailure) throw configFailure;
          return "fixture config";
        },
      },
      roboSay: (value) => value,
      console: { error() {} },
      yaml: { parse: () => ({ procedure: "command" }) },
      path: { resolve: () => "/fixture/blossm.yaml" },
      process: { cwd: () => "/fixture" },
    },
    "export const cli = ",
  );
};

describe("CLI asynchronous dispatch", () => {
  it("returns completion for direct commands and shortcuts", async () => {
    for (const domain of ["command", "secret", "queue", "deploy", "test"]) {
      let resolve;
      const pending = new Promise((done) => {
        resolve = done;
      });
      const cli = await fixture(domain, () => pending);
      const result = cli(["node", "blossm", domain]);
      let completed = false;
      result.then(() => {
        completed = true;
      });
      await Promise.resolve();
      assert.strictEqual(completed, false);
      resolve("complete");
      assert.strictEqual(await result, "complete");
    }
  });
  it("propagates asynchronous failure from direct commands and shortcuts", async () => {
    for (const domain of ["command", "deploy", "test"]) {
      const failure = new Error("operation failed");
      const cli = await fixture(domain, async () => {
        throw failure;
      });
      await assert.rejects(
        cli(["node", "blossm", domain]),
        (err) => err === failure,
      );
    }
  });
  it("propagates synchronous shortcut configuration failures", async () => {
    const failure = new Error("config failed");
    const cli = await fixture("deploy", () => {}, { configFailure: failure });
    await assert.rejects(
      cli(["node", "blossm", "deploy"]),
      (error) => error === failure,
    );
  });

  for (const file of [
    "init/index.js",
    "queue/create/index.js",
    "secret/create/index.js",
    "roles/upload/index.js",
  ]) {
    it(`returns the private action promise from ${file}`, async () => {
      // Test the exported normalize/prompt wrapper without running filesystem
      // scaffolding or provider actions in its private implementation.
      const source = fs.readFileSync(
        path.join(cliDir, "blossm/src", file),
        "utf8",
      );
      const exported = source
        .slice(source.indexOf("export default "))
        .replace("export default ", "return ");
      let release;
      const pending = new Promise((resolve) => {
        release = resolve;
      });
      let failed = false;
      const failure = new Error("leaf failed");
      const operation = () => (failed ? Promise.reject(failure) : pending);
      const action = new Function(
        "normalize",
        "create",
        "upload",
        "rootDir",
        exported,
      )(
        async () => ({ message: "fixture", env: "development" }),
        operation,
        operation,
        { config: () => ({}) },
      );
      const result = action([]);
      release("complete");
      assert.equal(await result, "complete");
      failed = true;
      await assert.rejects(action([]), (error) => error === failure);
    });
  }

  for (const mode of ["success", "error", "null"]) {
    it(`owns executable completion/exit status for ${mode}`, () => {
      const directory = fs.mkdtempSync(path.join(os.tmpdir(), "blossm-bin-"));
      try {
        fs.mkdirSync(path.join(directory, "bin"));
        fs.mkdirSync(path.join(directory, "src"));
        fs.writeFileSync(
          path.join(directory, "package.json"),
          JSON.stringify({ type: "module" }),
        );
        fs.copyFileSync(
          path.join(cliDir, "blossm/bin/blossm"),
          path.join(directory, "bin/blossm"),
        );
        fs.writeFileSync(
          path.join(directory, "src/index.js"),
          `export async function cli() {
          await new Promise(resolve => setTimeout(resolve, 10));
          if (process.env.MODE === "error") throw new Error("fixture failed");
          if (process.env.MODE === "null") throw null;
          console.log("complete");
        }`,
        );
        const result = spawnSync(
          process.execPath,
          ["--unhandled-rejections=warn", path.join(directory, "bin/blossm")],
          { encoding: "utf8", env: { MODE: mode }, timeout: 3000 },
        );
        assert.equal(result.status, mode === "success" ? 0 : 1, result.stderr);
        assert.equal(result.stdout, mode === "success" ? "complete\n" : "");
        assert.equal(
          result.stderr,
          mode === "success"
            ? ""
            : mode === "error"
              ? "fixture failed\n"
              : "null\n",
        );
      } finally {
        fs.rmSync(directory, { recursive: true, force: true });
      }
    });
  }
});
