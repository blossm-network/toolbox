const { expect } = require("chai").use(require("sinon-chai"));

const validate = require("../../validate");

const goodPayload = {
  code: "some-code"
};

describe("Command handler store validator tests", () => {
  it("should handle correct payload correctly", async () => {
    try {
      await validate(goodPayload);
    } catch (e) {
      //shouldn't be called;
      expect(1).to.equal(0);
    }
  });
  it("should throw if bad name is passed", async () => {
    const payload = {
      ...goodPayload,
      code: 123
    };

    try {
      await validate(payload);
      expect(0).to.equal(1);
    } catch (e) {
      expect(e.statusCode).to.equal(400);
    }
  });
});
