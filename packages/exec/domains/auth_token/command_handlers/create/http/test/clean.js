const { expect } = require("chai");
const clean = require("../src/clean");

describe("Clean", () => {
  it("should handle correct params correctly", async () => {
    const body = {
      payload: {
        permissions: [{ bogus: 23 }],
        bogus: 23
      }
    };

    await clean(body);

    expect(body.payload.metadata).to.deep.equal({});
    expect(body.payload.permissions).to.deep.equal([{}]);
  });
});
