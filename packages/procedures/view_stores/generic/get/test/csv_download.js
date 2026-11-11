import assert from "node:assert/strict";
import get from "../index.js";

it("protects stored strings in actual CSV downloads without changing stored values", async () => {
  const prior = process.env.CONTEXT;
  delete process.env.CONTEXT;
  try {
    const rows = [
      { headers: { id: "@id" }, body: { text: "=1+1", amount: -3 } },
    ];
    let output, responseHeaders;
    const handler = get({
      findFn: async () => rows,
      countFn: async () => rows.length,
      formatCsv: {
        fieldsFn: () => [{ label: "=header", value: "text" }, "amount"],
        fn: (body) => body,
      },
    });
    await handler(
      { query: { download: "csv" }, params: {} },
      {
        writeHead: (status, headers) => {
          assert.equal(status, 200);
          responseHeaders = headers;
        },
        end: (csv) => {
          output = csv;
        },
      },
    );
    assert.equal(responseHeaders["Content-Type"], "text/csv");
    assert.equal(responseHeaders["Content-Disposition"], "attachment");
    assert.equal(output, `"'=header","amount","id"\n"'=1+1",-3,"'@id"`);
    assert.deepEqual(rows, [
      { headers: { id: "@id" }, body: { text: "=1+1", amount: -3 } },
    ]);
  } finally {
    if (prior === undefined) delete process.env.CONTEXT;
    else process.env.CONTEXT = prior;
  }
});
