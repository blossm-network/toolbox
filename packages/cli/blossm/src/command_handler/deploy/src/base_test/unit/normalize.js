const { expect } = require("chai").use(require("sinon-chai"));

const normalize = require("../../normalize");

const { testing } = require("../../config.json");

describe("Command handler store normalize tests", () => {
  it("should clean correctly", async () => {
    for (const { payload, normalized } of testing.examples) {
      const cleanedPayload = await normalize({
        ...payload,
        bogusPropertyasdf: "nope"
      });

      expect(cleanedPayload).to.deep.equal(normalized);
    }
  });
});
