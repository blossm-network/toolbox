const { expect } = require("chai");
const clean = require("../src/clean");

describe("Clean", () => {
  it("should handle correct params correctly", async () => {
    const body = {
      payload: {}
    };

    await clean(body);

    expect(body.payload.metadata).to.deep.equal({});
  });
});
