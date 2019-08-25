const { expect } = require("chai");
const clean = require("../src/clean");

describe("Clean", () => {
  it("should handle correct params correctly", async () => {
    const params = {
      payload: {
        bogus: 23
      }
    };

    await clean(params);

    expect(params.payload.metadata).to.deep.equal({});
  });
});
