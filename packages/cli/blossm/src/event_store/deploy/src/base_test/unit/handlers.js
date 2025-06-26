import * as chai from "chai";

import config from "../../config.json" with { type: "json" };
import handlers from "../../handlers.js";

const { expect } = chai;

describe("Event store handlers tests", () => {
  it("should return correctly", async () => {
    for (const handler of config.testing.handlers) {
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
