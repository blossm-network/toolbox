import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  symlinkSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkWorkspaces } from "../workspaces.js";

const fixture = (run) => {
  const root = mkdtempSync(join(tmpdir(), "blossm-workspaces-"));
  const json = (path, data) => {
    mkdirSync(join(root, path, ".."), { recursive: true });
    writeFileSync(join(root, path), JSON.stringify(data));
  };
  try {
    const files = [
      "package.json",
      "packages/a/package.json",
      "packages/b/package.json",
    ];
    json("package.json", { name: "root", private: true });
    json(files[1], {
      name: "@blossm/a",
      version: "0.0.1",
      dependencies: { "@blossm/b": "^0.0.40" },
    });
    json(files[2], { name: "@blossm/b", version: "0.0.40" });
    mkdirSync(join(root, "node_modules/@blossm"), { recursive: true });
    symlinkSync(join(root, "packages/b"), join(root, "node_modules/@blossm/b"));
    run({ root, files, json });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

test("workspace identity checks compatible local source", () =>
  fixture(({ root, files }) => {
    checkWorkspaces(root, files);
  }));

test("workspace identity rejects an incompatible 0.0.x caret range", () =>
  fixture(({ root, files, json }) => {
    json(files[1], {
      name: "@blossm/a",
      dependencies: { "@blossm/b": "^0.0.16" },
    });
    assert.throws(() => checkWorkspaces(root, files), /does not include local/);
  }));

test("workspace identity rejects missing source and registry shadow copies", () =>
  fixture(({ root, files, json }) => {
    assert.throws(
      () => checkWorkspaces(root, files.slice(0, 2)),
      /no local workspace source/,
    );
    rmSync(join(root, "node_modules/@blossm/b"));
    json("node_modules/@blossm/b/package.json", {
      name: "@blossm/b",
      version: "0.0.40",
    });
    assert.throws(
      () => checkWorkspaces(root, files),
      /outside its workspace source/,
    );
  }));
