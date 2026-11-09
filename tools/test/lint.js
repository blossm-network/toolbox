import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const lint = (source) =>
  spawnSync(
    process.execPath,
    [
      "node_modules/eslint/bin/eslint.js",
      "--stdin",
      "--stdin-filename",
      "audit-check.js",
    ],
    { cwd: root, input: source, encoding: "utf8" },
  );

test("lint accepts ordinary ESM and rejects undefined bindings", () => {
  assert.equal(lint("export default 1;\n").status, 0);
  const invalid = lint("export default missingAuditBinding;\n");
  assert.notEqual(invalid.status, 0);
  assert.match(invalid.stdout + invalid.stderr, /no-undef/);
});
