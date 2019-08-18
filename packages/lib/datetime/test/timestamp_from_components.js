const { expect } = require("chai");

const { timestampFromComponents } = require("../index");

describe("Converts correctly", () => {
  it("it should return the correct timestamp", async () => {
    const time = 400;
    const day = 1;
    const month = 0;
    const year = 1970;

    const components = {
      time,
      day,
      month,
      year
    };

    expect(timestampFromComponents(components)).to.equal(time);
  });
});
