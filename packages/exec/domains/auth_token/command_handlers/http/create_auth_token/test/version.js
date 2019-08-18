const { expect } = require("chai");
const version = require("../src/version");

describe("Version", () => {
  it("should have the correct version", async () => {
    expect(version).to.equal(0);
  });
});
