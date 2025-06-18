import * as chai from "chai";
import uuidValidator from "../index.js";

const { expect } = chai;

describe("UUID", () => {
  it("should validate a guid.", () => {
    const shouldBeTrue = uuidValidator("c51c80c2-66a1-442a-91e2-4f55b4256a72");
    const shouldBeFalse = uuidValidator("bad");
    expect(shouldBeTrue).to.be.true;
    expect(shouldBeFalse).to.be.false;
  });
});
