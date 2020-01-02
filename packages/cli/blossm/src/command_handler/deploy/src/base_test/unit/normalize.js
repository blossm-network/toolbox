const { expect } = require("chai").use(require("sinon-chai"));

const normalize = require("../../normalize");

const { examples } = require("../../config.json");

describe("Command handler store normalize tests", () => {
  it("should clean correctly", async () => {
    for (const { payload, normalized } in examples) {
      const cleanedPayload = await normalize({
        ...payload,
        bogusPropertyasdf: "nope"
      });

      expect(cleanedPayload).to.deep.equal(normalized);
    }
  });
});
