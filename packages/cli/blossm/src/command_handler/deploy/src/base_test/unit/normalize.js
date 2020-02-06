const { expect } = require("chai").use(require("sinon-chai"));

const normalize = require("../../normalize");

const { testing } = require("../../config.json");

describe("Command handler store normalize tests", () => {
  it("should have at least one example", async () => {
    expect(testing.normalize).to.exist;
  });
  it("should clean correctly", async () => {
    for (const { payload, normalized } of testing.normalize) {
      const cleanedPayload = await normalize({
        ...payload,
        bogusPropertyasdf: "nope"
      });

      expect(cleanedPayload).to.deep.equal(normalized);
    }
  });
});
