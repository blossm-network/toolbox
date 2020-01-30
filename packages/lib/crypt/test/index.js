const { expect } = require("chai");

const { hash, compare } = require("..");

describe("Hash", () => {
  it("it should create a unique hash and compare successfully", async () => {
    const someString = "some-string";
    const hashResult = await hash(someString);
    const doEqual = await compare(someString, hashResult);
    expect(doEqual).to.be.true;
  });
  it("it should fail if comparing hash to different value", async () => {
    const someString = "some-string";
    const hashResult = await hash(someString);
    const doEqual = await compare("bogus", hashResult);
    expect(doEqual).to.be.false;
  });
});
