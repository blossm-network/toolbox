const { expect } = require("chai");

const { weekdayDateStringFromTimestamp } = require("..");

describe("Converts correctly", () => {
  it("it should return an expected string based on the utc timestamp", async () => {
    const timestamp = 1559329637;

    expect(weekdayDateStringFromTimestamp(timestamp)).to.equal(
      "Friday, May 31st"
    );
  });
});
