import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const lerna = join(root, "node_modules/lerna/dist/cli.js");

test("Lerna reports failing packages even when continuing other tests", () => {
  const dir = mkdtempSync(join(tmpdir(), "blossm-lerna-check-"));
  const json = (file, value) =>
    writeFileSync(join(dir, file), JSON.stringify(value));
  try {
    execFileSync("git", ["init", "--quiet", dir]);
    json("package.json", {
      name: "lerna-failure-check",
      private: true,
      workspaces: ["packages/*"],
    });
    json("lerna.json", { version: "independent", npmClient: "npm" });
    json("nx.json", { targetDefaults: { test: { cache: false } } });
    for (const name of ["fail", "pass"]) {
      mkdirSync(join(dir, "packages", name), { recursive: true });
      json(`packages/${name}/package.json`, {
        name: `@audit/${name}`,
        version: "0.0.0",
        scripts: {
          test: `node -e "require('fs').writeFileSync('executed','yes'); process.exit(${name === "fail" ? 9 : 0})"`,
        },
      });
    }
    const result = spawnSync(
      process.execPath,
      [lerna, "run", "test", "--no-bail", "--concurrency", "2"],
      {
        cwd: dir,
        encoding: "utf8",
        timeout: 30000,
        env: {
          ...process.env,
          PATH: `${dirname(process.execPath)}:${process.env.PATH}`,
          NX_DAEMON: "false",
          NX_SKIP_NX_CACHE: "true",
        },
      },
    );
    assert.equal(result.error, undefined, result.error?.message);
    assert.notEqual(result.status, 0, result.stdout + result.stderr);
    for (const name of ["fail", "pass"]) {
      assert.equal(
        readFileSync(join(dir, "packages", name, "executed"), "utf8"),
        "yes",
        result.stdout + result.stderr,
      );
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
