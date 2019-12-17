const { expect } = require("chai").use(require("sinon-chai"));

const normalize = require("../../normalize");

describe("Command handler store normalize tests", () => {
  it("should clean correctly", async () => {
    const payload = {
      phone: "(202) 318-9798",
      bogus: "nope"
    };
    const cleanedPayload = await normalize(payload);
    expect(cleanedPayload).to.deep.equal({
      phone: "+12023189798"
    });
  });
});
