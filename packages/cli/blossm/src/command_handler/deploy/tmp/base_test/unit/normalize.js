const { expect } = require("chai").use(require("sinon-chai"));

const normalize = require("../../normalize");

const { testing } = require("../../config.json");

describe("Command handler store normalize tests", () => {
  it("should have at least one example", async () => {
    expect(testing.examples.ok[0]).to.exist;
  });
  it("should clean correctly", async () => {
    for (const { payload, normalized } of [
      ...testing.examples.ok,
      ...(testing.examples.bad || [])
    ]) {
      const cleanedPayload = await normalize({
        ...payload,
        bogusPropertyasdf: "nope"
      });

      expect(cleanedPayload).to.deep.equal(normalized);
    }
  });
});
