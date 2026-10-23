import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const template = readFileSync(
  new URL("../src/command/deploy/src/validate.js", import.meta.url),
  "utf8"
);
const load = async (payload) => {
  const source = template
    .replace(
      '"@blossm/validator"',
      JSON.stringify(
        new URL("../../../lib/validator/index.js", import.meta.url).href
      )
    )
    .replace(
      /import config from .*?;/,
      `const config = ${JSON.stringify({ payload })};`
    );
  return (
    await import(
      `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
    )
  ).default;
};

describe("Generated command literal constraints", () => {
  for (const [type, literal, other] of [
    ["boolean", false, true],
    ["number", 0, 1],
    ["string", "", "other"],
  ]) {
    for (const array of [false, true]) {
      it(`enforces ${type} ${JSON.stringify(literal)} in ${
        array ? "array items" : "scalars"
      }`, async () => {
        const shape = { type, is: literal };
        const validate = await load({
          value: array ? { type: [shape] } : shape,
        });
        assert.doesNotThrow(() =>
          validate({ value: array ? [literal] : literal })
        );
        assert.throws(() => validate({ value: array ? [other] : other }));
      });
    }
  }
});
