const { expect } = require("chai");

const reduce = require("..");

describe("Event store reduce", () => {
  it("should call with the correct params", async () => {
    const key = "some-key";
    const values = [
      { payload: { a: 1, b: 2 }, _metadata: { count: 1 } },
      { payload: { a: 2, c: 3 }, _metadata: { count: 1 } }
    ];
    const aggregate = reduce(key, values);
    expect(aggregate).to.deep.equal({
      root: key,
      metadata: { count: 2 },
      payload: {
        a: 2,
        b: 2,
        c: 3
      }
    });
  });
  it("should call with the correct params if empty", async () => {
    const key = "some-key";
    const values = [];
    const aggregate = reduce(key, values);
    expect(aggregate).to.deep.equal({
      root: key,
      payload: {},
      metadata: { count: 0 }
    });
  });
});
