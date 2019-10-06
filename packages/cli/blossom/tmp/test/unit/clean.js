const { expect } = require("chai").use(require("sinon-chai"));

const clean = require("../../clean");

describe("Command handler store clean tests", () => {
  it("should clean correctly", async () => {
    const payload = {
      name: "Some-name",
      bogus: "nope"
    };

    const cleanedPayload = await clean(payload);

    expect(cleanedPayload).to.deep.equal({
      name: "some-name"
    });
  });
});
