import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = new URL("../../build.yaml", import.meta.url);
const manifest = new URL("../../package.json", import.meta.url);

test("ordinary CI verifies frozen dependencies without release authority", () => {
  const build = readFileSync(source, "utf8");
  assert.doesNotMatch(build, /lerna-publish|npm\s+publish|NPM_TOKEN/);
  assert.match(build, /args: \["install", "--frozen-lockfile"\]/);
  assert.match(build, /args: \["check-packages"\]/);
  assert.match(build, /HUSKY=0/);
  const { scripts } = JSON.parse(readFileSync(manifest, "utf8"));
  assert.equal(
    scripts["check-packages"],
    "yarn runtime:check && yarn lint && yarn test",
  );
  assert.equal(scripts["lerna-publish"], "lerna publish -y from-package");
});
