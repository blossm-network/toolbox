const { expect } = require("chai");

const reduce = require("..");

describe("Mongodb event store reduce", () => {
  it("should call with the correct params", async () => {
    const key = "some-key";
    const firstNumber = 3;
    const otherNumber = 4;
    const number = 5;
    const values = [
      {
        state: { a: 1, b: 2 },
        headers: { lastEventNumber: otherNumber }
      },
      {
        state: { a: 4, d: 3 },
        headers: { lastEventNumber: number }
      },
      {
        state: { a: 2, b: 3, c: 3 },
        headers: { lastEventNumber: firstNumber }
      }
    ];
    const aggregate = reduce(key, values);
    expect(aggregate).to.deep.equal({
      headers: {
        root: key,
        lastEventNumber: 5
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
    const firstNumber = 3;
    const otherNumber = 4;
    const number = 5;
    const values = [
      {
        state: { a: 4, d: 3 },
        headers: { lastEventNumber: number }
      },
      {
        state: { a: 2, b: 3, c: 3 },
        headers: { lastEventNumber: firstNumber }
      },
      {
        state: { a: 1, b: 2 },
        headers: { lastEventNumber: otherNumber }
      }
    ];
    const aggregate = reduce(key, values);
    expect(aggregate).to.deep.equal({
      headers: {
        root: key,
        lastEventNumber: 5
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
        lastEventNumber: 0
      },
      state: {}
    });
  });
});
