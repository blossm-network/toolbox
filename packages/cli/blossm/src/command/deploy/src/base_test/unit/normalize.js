const fs = require("fs");
const { expect } = require("chai").use(require("sinon-chai"));

const exists = fs.existsSync("../../normalize.js");

const normalize =
  fs.existsSync("../../normalize.js") && require("../../normalize");

const { testing } = require("../../config.json");

describe("Command handler store normalize tests", () => {
  it("should have at least one example", async () => {
    expect(testing.normalize).to.exist;
  });
  it("should clean correctly", async () => {
    //TODO
    //eslint-disable-next-line no-console
    console.log({ exists, normalize });
    if (!normalize) return;
    for (const { payload, normalized } of testing.normalize) {
      const cleanedPayload = await normalize({
        ...payload,
        bogusPropertyasdf: "nope",
      });

      expect(cleanedPayload).to.deep.equal(normalized);
    }
  });
});
