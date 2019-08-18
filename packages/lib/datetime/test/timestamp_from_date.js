const { expect } = require("chai");

const { timestampFromDate } = require("../index");

describe("Converts correctly", () => {
  it("it should return a timestamp used to create the date", async () => {
    const timestamp = 1559329637;
    const timestampToMilliseconds = timestamp * 1000;
    const date = new Date(timestampToMilliseconds);
    expect(timestampFromDate(date)).to.equal(timestamp);
  });
});
