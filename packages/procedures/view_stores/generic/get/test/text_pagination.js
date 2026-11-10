import assert from "node:assert/strict";
import serverDeps from "../../../../server/deps.js";
import get from "../index.js";

it("preserves text search, query and sort when following the next-page URL", async () => {
  const previousContext = process.env.CONTEXT;
  delete process.env.CONTEXT;
  try {
    const text = 'name & "exact phrase" + café';
    const requests = [];
    const counts = [];
    const parse = serverDeps.express().get("query parser fn");
    const records = [0, 1, 2].map((id) => ({
      body: { id },
      headers: { id: String(id) },
      trace: {},
    }));
    const handler = get({
      findFn: async (options) => {
        requests.push(options);
        return records.slice(options.skip, options.skip + options.limit);
      },
      countFn: async (options) => {
        counts.push(options);
        return records.length;
      },
      formatFn: ({ body }) => body,
    });
    let page;
    const response = {
      send: (value) => {
        page = value;
      },
    };
    await handler(
      {
        params: {},
        query: {
          text,
          query: { active: "yes" },
          sort: { id: "1" },
          limit: "2",
        },
      },
      response,
    );
    assert.equal(page.content.length, 2);
    const next = new URL(page.next);
    await handler({ params: {}, query: parse(next.search.slice(1)) }, response);
    assert.equal(page.content.length, 1);
    assert.equal(page.next, undefined);
    assert.deepEqual(
      requests.map(({ skip }) => skip),
      [0, 2],
    );
    for (const request of requests) {
      assert.equal(request.text, text);
      assert.deepEqual(request.query, { "body.active": "yes" });
      assert.deepEqual(request.sort, { "body.id": 1 });
      assert.equal(request.limit, 2);
    }
    assert.deepEqual(counts, [
      { query: { "body.active": "yes" }, text },
      { query: { "body.active": "yes" }, text },
    ]);
  } finally {
    if (previousContext === undefined) delete process.env.CONTEXT;
    else process.env.CONTEXT = previousContext;
  }
});
