const { expect } = require("chai").use(require("sinon-chai"));

const { testing } = require("../../config.json");

const handlers = require("../../handlers.js");

describe("Event store handlers tests", () => {
  it("should return correctly", async () => {
    for (const handler of testing.handlers) {
      for (const example of handler.examples) {
        const result = handlers[handler.action](
          example.state || {},
          example.payload
        );
        expect(result).to.deep.equal(example.result || example.payload);
      }
    }
  });
});
