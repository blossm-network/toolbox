import assert from "node:assert/strict";
import urlEncodeQueryData from "@blossm/url-encode-query-data";
import serverDeps from "../../../../server/deps.js";
import get from "../index.js";

// Use the same query encoder and Express parser as requests into this boundary.
// Persistence is controlled so schema casting cannot hide incorrect input types.
const run = async (query) => {
  const context = process.env.CONTEXT
    ? {
        [process.env.CONTEXT]: {
          root: "scope",
          service: "core",
          network: "fixture",
        },
      }
    : undefined;
  const uri = new URL(
    urlEncodeQueryData("http://fixture.invalid", {
      query,
      ...(context && { context }),
    }),
  );
  const parse = serverDeps.express().get("query parser fn");
  let parsed;
  let received;
  await get({
    queryFn: (query) => {
      parsed = query;
      return query;
    },
    findFn: async ({ query }) => {
      received = query;
      return [];
    },
    countFn: async () => 0,
  })({ params: {}, query: parse(uri.search.slice(1)) }, { send: () => {} });
  return { parsed, received };
};

describe("View query marker roundtrip", () => {
  it("decodes nested number and date arrays before custom query mapping and persistence", async () => {
    const date = "2020-12-09T02:50:59.076Z";
    const { parsed, received } = await run({
      numbers: { $in: ["#0", "#2"] },
      dates: { $in: [`@${date}`] },
      nested: { $elemMatch: { count: { $in: ["#3", "#4"] } } },
    });
    assert.deepEqual(parsed.numbers, { $in: [0, 2] });
    assert.deepEqual(parsed.dates, { $in: [new Date(date)] });
    assert.deepEqual(parsed.nested, { $elemMatch: { count: { $in: [3, 4] } } });
    assert.deepEqual(received["body.numbers"], parsed.numbers);
    assert.deepEqual(received["body.dates"], parsed.dates);
    assert.deepEqual(received["body.nested"], parsed.nested);
  });

  it("keeps noncanonical numeric property names as an object", async () => {
    const { parsed, received } = await run({ map: { 0: "#1", "01": "#2" } });
    assert.deepEqual(parsed.map, { 0: 1, "01": 2 });
    assert.deepEqual(received["body.map"], parsed.map);
  });

  it("keeps ordinary strings as strings without implicit numeric or boolean coercion", async () => {
    const input = {
      name: "alice",
      zero: "0",
      boolean: "false",
      values: ["one", "two"],
    };
    const { parsed } = await run(input);
    assert.deepEqual(parsed, input);
  });
});
