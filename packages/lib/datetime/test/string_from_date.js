const { expect } = require("chai");

const { stringFromDate } = require("..");

describe("Converts correctly", () => {
  it("it should return a timestamp used to create the date", async () => {
    const string = "1995-12-04T00:12:00.000Z";
    const date = new Date(Date.parse(string));
    expect(stringFromDate(date)).to.equal(string);
  });
});
