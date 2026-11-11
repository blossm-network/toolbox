import assert from "node:assert/strict";
import * as chai from "chai";
import { load } from "./load.js";

const example = (value) => ({ update: { value }, get: { value } });
const run = async ({
  extra = false,
  brokenSort = false,
  sorted = false,
} = {}) => {
  const cases = new Map();
  const examples = [example("first"), example("second")];
  const response = (content, count = 1) => ({
    statusCode: 200,
    body: JSON.stringify({ updates: [], count, content }),
  });
  const responses = [response([examples[0].get])];
  if (extra) {
    examples.push(example("third"));
    responses.push(response([examples[2].get]));
  }
  responses.push(response([examples[1].get]));
  if (sorted)
    responses.push(
      response([examples[0].get, examples[1].get], 2),
      response([examples[1].get, examples[0].get], 2),
      response(
        brokenSort
          ? [examples[1].get, examples[0].get]
          : [examples[0].get, examples[1].get],
        2,
      ),
      response([examples[0].get], 4),
    );
  await load(
    "blossm/src/view_store/deploy/src/base_test/integration/index.js",
    {
      chai,
      process: { env: {} },
      config: {
        indexes: [[{ value: 1 }]],
        testing: {
          examples,
          ...(sorted && { sorts: [{ index: 0, order: [0, 1] }] }),
        },
      },
      describe: (_name, fn) => fn(),
      it: (name, fn) => cases.set(name, fn),
      uuid: () => "fixture-id",
      request: {
        put: async () => ({ statusCode: 200 }),
        get: async () => {
          assert.ok(responses.length, "unexpected extra read");
          return responses.shift();
        },
        del: async () => ({
          statusCode: 200,
          body: JSON.stringify({ deletedCount: 1 }),
        }),
      },
    },
  );
  await cases.get("should return successfully")();
  assert.equal(responses.length, 0);
};

describe("Generated view response assertions", () => {
  it("checks the fresh response for an additional example", async () => {
    await run({ extra: true });
  });
  it("checks sorted rows against each configured example", async () => {
    await run({ sorted: true });
  });
  it("rejects sorted rows that violate the configured order", async () => {
    await assert.rejects(
      run({ sorted: true, brokenSort: true }),
      chai.AssertionError,
    );
  });
});
