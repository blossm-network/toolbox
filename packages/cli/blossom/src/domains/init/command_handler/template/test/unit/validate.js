const { expect } = require("chai").use(require("sinon-chai"));

const validate = require("../../validate");

const goodPayload = {
  name: "some-name"
};

describe("Command handler store validator tests", () => {
  it("should handle correct payload correctly", async () => {
    expect(await validate(goodPayload)).to.not.throw;
  });
  it("should throw if bad name is passed", async () => {
    const payload = {
      ...goodPayload,
      name: 123
    };

    try {
      await validate(payload);
      expect(0).to.equal(1);
    } catch (e) {
      expect(e.statusCode).to.equal(400);
    }
  });
});
