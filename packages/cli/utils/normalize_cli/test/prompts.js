import assert from "node:assert/strict";
import { PassThrough } from "node:stream";
import { test } from "node:test";
import inquirer from "inquirer";

for (const [type, value, question] of [
  ["input", "offline-value", {}],
  ["select", "second", { choices: ["first", "second"], default: "second" }],
]) {
  test(
    `installed Inquirer ${type} preserves named answers and defaults`,
    { timeout: 5000 },
    async () => {
      const input = new PassThrough();
      const output = new PassThrough();
      const prompt = inquirer.createPromptModule({ input, output });
      let submitted = false;
      output.on("data", (chunk) => {
        if (!submitted && chunk.toString().includes("Fixture")) {
          submitted = true;
          setImmediate(() =>
            input.write(type === "input" ? `${value}\r` : "\r"),
          );
        }
      });
      try {
        assert.deepEqual(
          await prompt([
            { type, name: "answer", message: "Fixture", ...question },
          ]),
          { answer: value },
        );
      } finally {
        input.end();
        output.end();
      }
    },
  );
}
