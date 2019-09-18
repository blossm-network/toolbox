const { expect } = require("chai");
const urlEncodeQueryData = require("../index");

describe("Encode", () => {
  it("encodes correctly", () => {
    const key0 = "key0";
    const value0 = "value0";
    const key1 = "key1";
    const value1 = "value1";
    const data = {};
    data[key0] = value0;
    data[key1] = value1;

    expect(urlEncodeQueryData(data)).to.equal(
      `${key0}=${value0}&${key1}=${value1}`
    );
  });
  it("encodes correctly an empty string when zero params passed in", () => {
    const data = {};
    expect(urlEncodeQueryData(data)).to.be.empty;
  });
});
