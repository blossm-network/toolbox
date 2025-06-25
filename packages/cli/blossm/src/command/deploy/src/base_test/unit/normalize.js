import * as chai from "chai";
import sinonChai from "sinon-chai";
chai.use(sinonChai);
const { expect } = chai;

let normalize = undefined;
try {
  normalize = (await import("../../normalize.js")).default;
} catch (e) {
  // normalize.js does not exist, normalize remains undefined
}

const { testing } = (await import("../../config.json", { with: { type: "json" } })).default;

describe("Command handler store normalize tests", () => {
  it("should have at least one example", async () => {
    if (!normalize || !testing.normalize) return;
    expect(testing.normalize).to.exist;
  });
  it("should clean correctly", async () => {
    if (!normalize || !testing.normalize) return;
    for (const { payload, normalized } of testing.normalize) {
      const cleanedPayload = await normalize({
        ...payload,
        bogusPropertyasdf: "nope",
      });

      expect(cleanedPayload).to.deep.equal(normalized);
    }
  });
});
