import assert from "assert";
import arg from "arg";
import { load } from "./load.js";

const fixture = async () => {
  const messages = [];
  let prompts = 0;
  const normalize = await load("utils/normalize_cli/index.js", {
    arg,
    roboSay: (value) => value,
    chalk: { red: { bold: (value) => value } },
    inquirer: {
      prompt: async () => {
        prompts++;
        return { flagValue: "development" };
      },
    },
    process: {
      exit: (status) => {
        throw new Error(`exit ${status}`);
      },
    },
    console: { error: (...args) => messages.push(args) },
  });
  return { normalize, messages, promptCount: () => prompts };
};

describe("CLI flag value contracts", () => {
  it("rejects invalid supplied choices before any prompt or action", async () => {
    const test = await fixture();
    await assert.rejects(
      test.normalize({
        entrypointType: "path",
        entrypointDefault: ".",
        args: ["--env", "typo"],
        flags: [
          {
            name: "env",
            type: String,
            choices: ["development", "production"],
            default: "development",
          },
        ],
      }),
      /exit 1/
    );
    assert.strictEqual(test.promptCount(), 0);
    assert(
      test.messages.some((args) => args[0].includes("env must be one of"))
    );
  });
  it("preserves explicit false and zero instead of replacing them with defaults", async () => {
    const test = await fixture();
    const value = await test.normalize({
      entrypointType: "path",
      entrypointDefault: ".",
      args: ["--count", "0", "--enabled", "no"],
      flags: [
        { name: "count", type: Number, default: 10 },
        { name: "enabled", type: (value) => value === "yes", default: true },
      ],
    });
    assert.strictEqual(value.count, 0);
    assert.strictEqual(value.enabled, false);
    const defaults = await test.normalize({
      entrypointType: "path",
      entrypointDefault: ".",
      args: [],
      flags: [
        { name: "enabled", type: Boolean, default: false },
        { name: "count", type: Number, default: 0 },
      ],
    });
    assert.strictEqual(defaults.enabled, false);
    assert.strictEqual(defaults.count, 0);
    assert.strictEqual(test.promptCount(), 0);
  });
  it("distinguishes boolean presence from absent default and accepts valid choices", async () => {
    const test = await fixture();
    const result = await test.normalize({
      entrypointType: "path",
      entrypointDefault: ".",
      args: ["--enabled", "--env", "production"],
      flags: [
        { name: "enabled", type: Boolean, default: false },
        {
          name: "env",
          type: String,
          choices: ["production", "development"],
          default: "development",
        },
      ],
    });
    assert.strictEqual(result.enabled, true);
    assert.strictEqual(result.env, "production");
    assert.strictEqual(test.promptCount(), 0);
  });
});
