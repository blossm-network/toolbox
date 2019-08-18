const { expect } = require("chai");
const authorize = require("../src/authorize");

describe("Authorize", () => {
  it("should handle correct params correctly", async () => {
    const req = {
      body: {}
    };

    expect(await authorize(req)).to.not.throw;
  });
});
