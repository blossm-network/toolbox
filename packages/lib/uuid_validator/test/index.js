const { expect } = require("chai");
const uuidValidator = require("..");

describe("UUID", () => {
  it("should validate a guid.", () => {
    const shouldBeTrue = uuidValidator("c51c80c2-66a1-442a-91e2-4f55b4256a72");
    const shouldBeFalse = uuidValidator("bad");
    expect(shouldBeTrue).to.be.true;
    expect(shouldBeFalse).to.be.false;
  });
});
