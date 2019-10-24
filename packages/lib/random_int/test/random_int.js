const { expect } = require("chai");
const randomInt = require("../index");

describe("Difference", () => {
  it("should return a number between the range", () => {
    const min = 10;
    const max = 15;
    const numIterationsToTest = (max - min) * 20;
    for (let i = 0; i < numIterationsToTest; i++) {
      let num = randomInt({ min, max });
      expect(num).to.be.at.least(min);
      expect(num).to.be.at.most(max - 1);
    }
  });
});
