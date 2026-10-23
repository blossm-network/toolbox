import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const json = (relative) =>
  JSON.parse(readFileSync(new URL(relative, import.meta.url), "utf8"));
describe("CLI and generated manifest contracts", () => {
  for (const [relative, names] of [
    ["../package.json", ["fs-extra", "inquirer"]],
    ["../../utils/test_cli_template/package.json", ["@blossm/robo-say"]],
    ["../src/event_store/deploy/src/base_config.json", ["@blossm/gcp-kms"]],
    ["../src/fact/deploy/src/base_config.json", ["localenv", "chai-datetime"]],
    ["../src/view_composite/deploy/src/base_config.json", ["localenv"]],
  ]) {
    it(`declares directly imported packages in ${relative}`, () => {
      const manifest = json(relative);
      const dependencies = {
        ...manifest.dependencies,
        ...manifest.devDependencies,
      };
      for (const name of names)
        assert.ok(dependencies[name], `${name} must be declared directly`);
    });
  }
  it("declares the tools executed by its own fixture suites", () => {
    const dependencies = json("../package.json").devDependencies || {};
    for (const name of [
      "mocha",
      "chai",
      "arg",
      "sinon",
      "sinon-chai",
      "chai-datetime",
    ])
      assert.ok(
        dependencies[name],
        `${name} must be available to standalone CLI tests`
      );
  });
  it("points the CLI package main at its existing implementation", () => {
    assert.ok(
      existsSync(new URL(`../${json("../package.json").main}`, import.meta.url))
    );
  });
});
