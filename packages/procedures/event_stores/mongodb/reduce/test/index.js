const { expect } = require("chai");

const reduce = require("..");

describe("Mongodb event store reduce", () => {
  it("should call with the correct params", async () => {
    const key = "some-key";
    const firstCreated = 3;
    const otherCreated = 4;
    const created = 5;
    const values = [
      {
        state: { a: 1, b: 2 },
        headers: { created: otherCreated, version: 1 }
      },
      {
        state: { a: 4, d: 3 },
        headers: { created, version: 1 }
      },
      {
        state: { a: 2, b: 3, c: 3 },
        headers: { created: firstCreated, version: 1 }
      }
    ];
    const aggregate = reduce(key, values);
    expect(aggregate).to.deep.equal({
      headers: {
        root: key,
        created,
        version: 3
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
    const firstCreated = 3;
    const otherCreated = 4;
    const created = 5;
    const values = [
      {
        state: { a: 4, d: 3 },
        headers: { created, version: 1 }
      },
      {
        state: { a: 2, b: 3, c: 3 },
        headers: { created: firstCreated, version: 1 }
      },
      {
        state: { a: 1, b: 2 },
        headers: { created: otherCreated, version: 1 }
      }
    ];
    const aggregate = reduce(key, values);
    expect(aggregate).to.deep.equal({
      headers: {
        root: key,
        created,
        version: 3
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
        created: 0,
        version: 0
      },
      state: {}
    });
  });
});
