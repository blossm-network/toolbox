const { expect } = require("chai");

const main = require("../../main");

describe("Command handler unit tests", () => {
  it("should return successfully", async () => {
    const payload = "some-payload";
    const root = "some-root";

    const result = await main({ payload, root });
    expect(result).to.deep.equal({
      events: [{ payload, root, correctNumber: 0 }]
    });
  });
});
