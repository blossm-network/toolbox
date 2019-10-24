const { expect } = require("chai");
const randomIntOfLength = require("../index");

describe("Random", () => {
  it("should return an int of the specified length", () => {
    const length = 5;
    for (let i = 0; i < 100; i++) {
      const random = randomIntOfLength(length);
      expect(random).to.be.a("number");
      expect(random.toString()).to.have.length(length);
    }
  });
});
