import * as chai from "chai";
import sinonChai from "sinon-chai";
import normalize from "../../normalize.js";
import config from "../../config.json" with { type: "json" };

chai.use(sinonChai);
const { expect } = chai;

describe("Command handler normalize tests", () => {
  it("should have at least one example", async () => {
    if (!normalize || !config.testing.normalize) return;
    expect(config.testing.normalize).to.exist;
  });
  it("should clean correctly", async () => {
    if (!normalize || !config.testing.normalize) return;
    for (const { payload, normalized } of config.testing.normalize) {
      const cleanedPayload = await normalize({
        ...payload,
        bogusPropertyasdf: "nope",
      });

      expect(cleanedPayload).to.deep.equal(normalized);
    }
  });
});
