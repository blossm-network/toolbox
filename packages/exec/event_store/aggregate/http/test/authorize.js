const { expect } = require("chai");
const authorize = require("../src/authorize");

describe("Authorize", () => {
  it("should handle correct params correctly", async () => {
    const token = {};

    expect(await authorize(token)).to.not.throw;
  });
});
