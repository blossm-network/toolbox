const { utc } = require("moment");
const { expect } = require("chai");

const { componentsFromMoment } = require("../index");

describe("Converts correctly", () => {
  it("it should return correct components", async () => {
    const timestamp = 1559329637;
    const timestampInMilliseconds = timestamp * 1000;
    const moment = utc(timestampInMilliseconds);

    const components = componentsFromMoment(moment);
    expect(components.time).to.equal(68837);
    expect(components.day).to.equal(31);
    expect(components.month).to.equal(4);
    expect(components.year).to.equal(2019);
  });
});
