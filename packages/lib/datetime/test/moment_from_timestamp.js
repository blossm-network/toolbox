const { expect } = require("chai");

const { momentFromTimestamp } = require("..");

describe("Converts correctly", () => {
  it("it should return a moment with the same timestamp used to create it", async () => {
    const timestamp = 1559329637;
    const moment = momentFromTimestamp(timestamp);
    const timestampToMilliseconds = timestamp * 1000;
    expect(moment.utc().valueOf()).to.equal(timestampToMilliseconds);
  });
});
