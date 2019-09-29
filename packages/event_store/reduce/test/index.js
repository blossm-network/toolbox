const { expect } = require("chai");

const reduce = require("..");

describe("Event store reduce", () => {
  it("should call with the correct params", async () => {
    const key = "some-key";
    const values = [{ state: { a: 1, b: 2 } }, { state: { a: 2, c: 3 } }];
    const aggregate = reduce(key, values);
    expect(aggregate).to.deep.equal({
      headers: {
        root: key,
        events: 2
      },
      state: {
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
      headers: {
        root: key,
        events: 0
      },
      state: {}
    });
  });
});
