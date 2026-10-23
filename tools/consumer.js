// Explicit network check, separate from ordinary offline package tests.
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const dir = mkdtempSync(join(tmpdir(), "blossm-packed-consumer-"));
const env = {
  PATH: `${dirname(process.execPath)}:${process.env.PATH}`,
  NPM_CONFIG_REGISTRY: "https://registry.npmjs.org/",
  NPM_CONFIG_USERCONFIG: join(dir, "user.npmrc"),
  NPM_CONFIG_GLOBALCONFIG: join(dir, "global.npmrc"),
  NPM_CONFIG_CACHE: join(dir, "cache"),
};
try {
  writeFileSync(env.NPM_CONFIG_USERCONFIG, "");
  writeFileSync(env.NPM_CONFIG_GLOBALCONFIG, "");
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify({ private: true, type: "module" }),
  );
  const archives = [];
  for (const path of ["packages/errors", "packages/vendors/dwolla"]) {
    const packed = execFileSync(
      "npm",
      ["pack", "--ignore-scripts", "--json", "--pack-destination", dir],
      {
        cwd: join(root, path),
        env,
        encoding: "utf8",
      },
    );
    archives.push(join(dir, JSON.parse(packed)[0].filename));
  }
  execFileSync(
    "npm",
    ["install", "--ignore-scripts", "--no-audit", "--no-fund", ...archives],
    {
      cwd: dir,
      env,
      stdio: "pipe",
    },
  );
  execFileSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `
    import assert from 'node:assert/strict';
    import dwolla from '@blossm/dwolla';
    import deps from '@blossm/dwolla/deps.js';
    import {badRequest} from '@blossm/errors';
    assert.equal(deps.badRequestError, badRequest);
    assert.equal(badRequest.message('audit').statusCode, 400);
    const client = dwolla('audit-key', 'audit-secret', {environment: 'sandbox'});
    assert.equal(typeof client.customer.createDocument, 'function');
    const form = new deps.FormData();
    const bytes = Buffer.from([0, 1, 255]);
    form.append('file', bytes, {filename: 'a.txt"\\r\\nX-Injected: yes\\r\\n'});
    const encoded = form.getBuffer();
    assert(encoded.includes(bytes));
    assert(!encoded.toString().includes('\\r\\nX-Injected: yes\\r\\n'));
  `,
    ],
    { cwd: dir, env, stdio: "pipe" },
  );
  console.log(
    "Packed Dwolla/errors consumer passed outside workspace hoisting.",
  );
} finally {
  rmSync(dir, { recursive: true, force: true });
}
