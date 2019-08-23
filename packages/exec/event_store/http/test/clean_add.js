const { expect } = require("chai");
const clean = require("../src/clean_add");

describe("Clean add", () => {
  it("should handle correct params correctly", async () => {
    const body = {
      event: {
        fact: {
          bogus: 1,
          version: "30",
          createdTimestamp: "10",
          command: {
            bogus: 1,
            issuedTimestamp: "12"
          }
        }
      }
    };

    await clean(body);

    expect(body.event.fact).to.deep.equal({
      version: 30,
      createdTimestamp: 10,
      command: {
        issuedTimestamp: 12
      }
    });
  });
});
