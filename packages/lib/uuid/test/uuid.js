const { expect } = require("chai");
const uuid = require("..");

describe("UUID", () => {
  it("should create a guid.", () => {
    const uuid1 = uuid();
    const uuid2 = uuid();
    expect(uuid1).to.not.equal(uuid2);
  });
});
