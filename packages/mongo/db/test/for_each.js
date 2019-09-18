const { expect } = require("chai");
const { forEach } = require("../index");

describe("For each", () => {
  it("it should return the correct result", async () => {
    const store = {
      find: () => store,
      cursor: () => store,
      on: (param, fn) => {
        switch (param) {
        case "data":
          fn();
          return store;
        case "error":
          return store;
        case "end":
          return fn();
        }
      }
    };

    const result = await forEach({ store, query: {}, fn: () => {} });
    expect(result).to.be.undefined;
  });
});

describe("Throws", () => {
  it("it should throw if an error function is passed", async () => {
    const error = Error("no good");
    const store = {
      find: () => store,
      cursor: () => store,
      on: (param, fn) => {
        switch (param) {
        case "data":
          fn();
          return store;
        case "error":
          fn(error);
          return store;
        case "end":
          return fn();
        }
      }
    };
    await expect(
      forEach({ store, query: {}, fn: () => {} })
    ).to.be.rejectedWith(error);
  });
});
