const { expect } = require("chai");
const randomChar = require("../index");

const characters =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

describe("Difference", () => {
  it("should return a char in the list", () => {
    const numIterationsToTest = characters.length * 20;
    for (let i = 0; i < numIterationsToTest; i++) {
      expect(characters).to.include(randomChar());
    }
  });
});
