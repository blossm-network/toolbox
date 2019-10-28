const { expect } = require("chai").use(require("sinon-chai"));

const normalize = require("../../normalize");

describe("Command handler store normalize tests", () => {
  it("should clean correctly", async () => {
    const payload = {
      code: "Some-code",
      bogus: "nope"
    };

    const cleanedPayload = await normalize(payload);

    expect(cleanedPayload).to.deep.equal({
      code: "Some-code"
    });
  });
});
