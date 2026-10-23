import assert from "node:assert/strict";
import { test } from "node:test";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, relative, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const packages = [
  "packages/cli/utils/deploy_cli_template",
  "packages/cli/utils/execute_cli_template",
  "packages/cli/utils/merge_cli_template",
  "packages/cli/utils/permissions_lookup",
  "packages/lib/authenticate",
  "packages/lib/authorize",
  "packages/vendors/mongodb/db",
];

const dependencyRoot = (require, name) => {
  let directory = dirname(realpathSync(require.resolve(name)));
  while (true) {
    const manifest = join(directory, "package.json");
    if (
      existsSync(manifest) &&
      JSON.parse(readFileSync(manifest, "utf8")).name === name
    )
      return directory;
    const parent = dirname(directory);
    assert.notEqual(parent, directory, `Cannot find package root for ${name}`);
    directory = parent;
  }
};

const importOnly = `
import assert from "node:assert/strict";
import net from "node:net";
import dgram from "node:dgram";
import http from "node:http";
import https from "node:https";
import { syncBuiltinESMExports } from "node:module";
let connections = 0;
const denyNetwork = () => {
  connections++;
  throw new Error("Runtime import fixtures must not access the network.");
};
net.Socket.prototype.connect = denyNetwork;
dgram.Socket.prototype.send = denyNetwork;
http.request = https.request = denyNetwork;
globalThis.fetch = denyNetwork;
syncBuiltinESMExports();
const entry = await import(process.argv[1]);
await new Promise(setImmediate);
assert(Object.keys(entry).length > 0, "The actual package entrypoint must export its API.");
assert.equal(connections, 0, "Importing the package must not initiate network activity.");
`;

for (const packagePath of packages) {
  test(`${packagePath} imports with only declared runtime dependencies`, () => {
    const source = join(root, packagePath);
    const consumer = mkdtempSync(join(tmpdir(), "blossm-runtime-consumer-"));
    try {
      const manifest = JSON.parse(
        readFileSync(join(source, "package.json"), "utf8"),
      );
      cpSync(source, consumer, {
        recursive: true,
        filter: (path) =>
          !relative(source, path).split(sep).includes("node_modules"),
      });
      const require = createRequire(join(source, "package.json"));
      for (const name of Object.keys(manifest.dependencies || {})) {
        const destination = join(consumer, "node_modules", name);
        mkdirSync(dirname(destination), { recursive: true });
        symlinkSync(dependencyRoot(require, name), destination, "dir");
      }
      const result = spawnSync(
        process.execPath,
        [
          "--input-type=module",
          "-e",
          importOnly,
          pathToFileURL(join(consumer, manifest.main || "index.js")).href,
        ],
        {
          cwd: consumer,
          encoding: "utf8",
          timeout: 15000,
          env: { NODE_ENV: "local" },
        },
      );
      assert.ifError(result.error);
      assert.equal(
        result.status,
        0,
        `${manifest.name} failed its isolated import:\n${result.stderr}`,
      );
    } finally {
      rmSync(consumer, { recursive: true, force: true });
    }
  });
}
