const { expect } = require("chai");
const guid = require("..");

describe("UUID", () => {
  it("should create a guid.", () => {
    const guid1 = guid();
    const guid2 = guid();
    expect(guid1).to.not.equal(guid2);
  });
});
