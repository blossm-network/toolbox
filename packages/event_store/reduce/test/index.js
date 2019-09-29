const { expect } = require("chai");

const reduce = require("..");

describe("Event store reduce", () => {
  it("should call with the correct params", async () => {
    const key = "some-key";
    const values = [
      { a: 1, b: 2, _metadata: { count: 1 } },
      { a: 2, c: 3, _metadata: { count: 1 } }
    ];
    const aggregate = reduce(key, values);
    expect(aggregate).to.deep.equal({
      root: key,
      _metadata: { count: 2 },
      a: 2,
      b: 2,
      c: 3
    });
  });
  it("should call with the correct params if empty", async () => {
    const key = "some-key";
    const values = [];
    const aggregate = reduce(key, values);
    expect(aggregate).to.deep.equal({
      root: key,
      _metadata: { count: 0 }
    });
  });
});
