const { expect } = require("chai");
const { count } = require("../index");

describe("Count", () => {
  it("it should return the correct count", async () => {
    const numObjects = 4;
    const store = {
      countDocuments: () => numObjects
    };
    const result = await count({ store, query: {} });

    expect(result).to.equal(numObjects);
  });
});
