const { expect } = require("chai");
const clean = require("../src/clean");

describe("Clean", () => {
  it("should handle correct params correctly", async () => {
    const payload = {
      context: 1,
      scopes: [
        {
          a: 1
        }
      ],
      bogus: "nope"
    };

    await clean(payload);

    expect(payload).to.deep.equal({
      scopes: [{}],
      context: 1
    });
  });
});
