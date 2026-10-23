import * as chai from "chai";
import randomInt from "../index.js";

const { expect } = chai;

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

describe("Secure random integers", () => {
  it("does not use Math.random", () => {
    const original = Math.random;
    Math.random = () => {
      throw new Error("ordinary randomness is not credential entropy");
    };
    try {
      expect(randomInt({ min: 1, max: 10 })).to.be.within(1, 9);
    } finally {
      Math.random = original;
    }
  });
  it("retains the empty-range result", () => {
    expect(randomInt({ min: 1, max: 1 })).to.equal(null);
  });
});
