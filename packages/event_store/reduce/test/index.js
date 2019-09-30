const { expect } = require("chai");

const reduce = require("..");

describe("Event store reduce", () => {
  it("should call with the correct params", async () => {
    const key = "some-key";
    const firstModified = 3;
    const otherModified = 4;
    const lastModified = 5;
    const values = [
      { state: { a: 1, b: 2 }, headers: { modified: otherModified } },
      { state: { a: 4, d: 3 }, headers: { modified: lastModified } },
      { state: { a: 2, b: 3, c: 3 }, headers: { modified: firstModified } }
    ];
    const aggregate = reduce(key, values);
    expect(aggregate).to.deep.equal({
      headers: {
        root: key,
        modified: lastModified,
        events: 3
      },
      state: {
        a: 4,
        b: 2,
        c: 3,
        d: 3
      }
    });
  });
  it("should call with the correct params in different order", async () => {
    const key = "some-key";
    const firstModified = 3;
    const otherModified = 4;
    const lastModified = 5;
    const values = [
      { state: { a: 4, d: 3 }, headers: { modified: lastModified } },
      { state: { a: 2, b: 3, c: 3 }, headers: { modified: firstModified } },
      { state: { a: 1, b: 2 }, headers: { modified: otherModified } }
    ];
    const aggregate = reduce(key, values);
    expect(aggregate).to.deep.equal({
      headers: {
        root: key,
        modified: lastModified,
        events: 3
      },
      state: {
        a: 4,
        b: 2,
        c: 3,
        d: 3
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
        modified: 0,
        events: 0
      },
      state: {}
    });
  });
});
