const { expect } = require("chai");
const { utc } = require("moment");

const { timestampFromMoment } = require("..");

describe("Converts correctly", () => {
  it("it should return a timestamp used to create the moment", async () => {
    const timestamp = 1559329637;
    const timestampToMilliseconds = timestamp * 1000;
    const moment = utc(timestampToMilliseconds);
    expect(timestampFromMoment(moment)).to.equal(timestamp);
  });
});
