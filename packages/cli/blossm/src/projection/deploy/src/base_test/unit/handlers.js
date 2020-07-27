const { expect } = require("chai");

const { testing } = require("../../config.json");

const handlers = require("../../handlers.js");

describe("Projection handlers tests", () => {
  it("should return correctly", async () => {
    for (const handler of testing.handlers) {
      for (const example of handler.examples) {
        const result = handlers[handler.action.service][handler.action.domain]({
          state: example.state,
          ...(example.root && { root: example.root }),
        });
        expect(result).to.deep.equal(example.result);
      }
    }
  });
});
