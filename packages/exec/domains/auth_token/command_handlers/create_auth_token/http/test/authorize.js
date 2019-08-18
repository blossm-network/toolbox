const { expect } = require("chai");
const authorize = require("../src/authorize");

describe("Authorize", () => {
  it("should handle correct params correctly", async () => {
    const body = {};

    expect(await authorize(body)).to.not.throw;
  });
});
