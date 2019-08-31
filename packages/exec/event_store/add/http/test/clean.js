const { expect } = require("chai");
const clean = require("../src/clean");

describe("Clean add", () => {
  it("should handle correct params correctly", async () => {
    const params = {
      event: {
        fact: {
          bogus: 1,
          command: {
            bogus: 1
          }
        }
      }
    };

    await clean(params);

    expect(params.event.fact).to.deep.equal({
      command: {}
    });
  });
});
