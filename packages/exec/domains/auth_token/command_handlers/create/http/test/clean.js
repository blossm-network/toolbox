const { expect } = require("chai");
const clean = require("../src/clean");

describe("Clean", () => {
  it("should handle correct params correctly", async () => {
    const params = {
      payload: {},
      context: 1,
      scopes: [
        {
          a: 1
        }
      ],
      bogus: "nope"
    };

    await clean(params);

    expect(params).to.deep.equal({
      scopes: [{}],

      context: 1
    });
  });
});
