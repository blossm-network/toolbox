import assert from "node:assert/strict";
import serverDeps from "../../../../server/deps.js";
import get from "../index.js";

const parse = serverDeps.express().get("query parser fn");
const run = async (search, options = {}) => {
  const query = parse(search);
  if (process.env.CONTEXT)
    query.context = {
      ...query.context,
      [process.env.CONTEXT]: {
        root: "scope",
        service: "core",
        network: "fixture",
      },
    };
  const calls = [];
  await get({
    findFn: async (params) => {
      calls.push(params);
      return [{ body: {}, headers: { id: "one" }, trace: {} }];
    },
    countFn: async () => 1,
    formatFn: ({ body }) => body,
    ...options,
  })({ params: {}, query }, { send: () => {} });
  return calls;
};

describe("View pagination wire bounds", () => {
  it("rejects malformed, repeated and structured values before persistence", async () => {
    for (const search of [
      "limit=",
      "limit=0",
      "limit=101",
      "limit=-2",
      "limit=2oops",
      "limit=1.5",
      "limit=1&limit=2",
      "limit[x]=1",
      "limit[]=2",
      "skip=-1",
      "skip=1.5",
      "skip=1oops",
      "skip=9007199254740992",
    ]) {
      let calls = 0;
      await assert.rejects(
        run(search, {
          findFn: async () => {
            calls++;
            return [];
          },
          countFn: async () => {
            calls++;
            return 0;
          },
        }),
        (error) => error.statusCode === 400,
        search,
      );
      assert.equal(calls, 0, search);
    }
  });

  it("normalizes accepted wire values and defaults", async () => {
    for (const [search, limit, skip] of [
      ["", 50, 0],
      ["limit=1&skip=0", 1, 0],
      ["limit=100&skip=2", 100, 2],
    ]) {
      const [call] = await run(search);
      assert.equal(call.limit, limit);
      assert.equal(call.skip, skip);
    }
  });

  it("keeps single-record and bootstrap reads fixed at one record", async () => {
    const [one] = await run("limit=101&skip=-1", { one: true });
    assert.equal(one.limit, 1);
    assert.equal(one.skip, 0);
    const previous = process.env.BOOTSTRAP_CONTEXT;
    process.env.BOOTSTRAP_CONTEXT = "principal";
    try {
      const [bootstrap] = await run(
        "bootstrap=true&context[principal][root]=one&limit=101&skip=-1",
      );
      assert.equal(bootstrap.limit, 1);
      assert.equal(bootstrap.skip, 0);
    } finally {
      if (previous === undefined) delete process.env.BOOTSTRAP_CONTEXT;
      else process.env.BOOTSTRAP_CONTEXT = previous;
    }
  });
});
