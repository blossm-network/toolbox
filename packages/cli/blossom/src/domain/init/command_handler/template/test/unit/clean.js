const { expect } = require("chai").use(require("sinon-chai"));

const clean = require("../validate");

describe("Command handler store clean tests", () => {
  it("should clean correctly", async () => {
    const payload = {
      name: "Some-name",
      bogus: "nope"
    };

    await clean(payload);

    expect(payload).to.deep.equal({
      name: "some-name"
    });
  });
});
