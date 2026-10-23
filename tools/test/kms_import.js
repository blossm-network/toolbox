import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

const importOnly = `
import assert from "node:assert/strict";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import { syncBuiltinESMExports } from "node:module";
let requests = 0;
const denyNetwork = () => {
  requests++;
  throw new Error("Importing a GCP adapter must not discover credentials.");
};
http.request = https.request = net.Socket.prototype.connect = denyNetwork;
globalThis.fetch = denyNetwork;
syncBuiltinESMExports();
await import(process.argv[1]);
await new Promise(setImmediate);
assert.equal(requests, 0, "The adapter import must remain offline without ADC or a project.");
`;

for (const adapter of ["kms", "queue"]) {
  test(`${adapter} import does not discover application default credentials`, () => {
    const entry = new URL(
      `../../packages/vendors/gcp/${adapter}/index.js`,
      import.meta.url,
    );
    const result = spawnSync(
      process.execPath,
      ["--input-type=module", "-e", importOnly, entry.href],
      { env: { NODE_ENV: "local" }, encoding: "utf8", timeout: 15000 },
    );
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stderr);
  });
}
