const { expect } = require("chai");

const { longDateStringFromTimestamp } = require("..");

describe("Converts correctly", () => {
  it("it should return an expected string based on the utc timestamp", async () => {
    const timestamp = 1559329637;

    expect(longDateStringFromTimestamp(timestamp)).to.equal(
      "May 31st 2019, 7:07:17 pm"
    );
  });
});
