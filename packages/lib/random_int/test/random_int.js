import * as chai from "chai";
import { randomInt as nativeRandomInt } from "crypto";
import deps from "../deps.js";
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
  it("uses native crypto randomness with the correct bounds", () => {
    expect(deps.randomInt).to.equal(nativeRandomInt);
    const original = deps.randomInt;
    let bounds;
    deps.randomInt = (...args) => {
      bounds = args;
      return 4;
    };
    try {
      expect(randomInt({ min: 1, max: 10 })).to.equal(4);
      expect(bounds).to.deep.equal([1, 10]);
    } finally {
      deps.randomInt = original;
    }
  });
  it("retains the empty-range result", () => {
    expect(randomInt({ min: 1, max: 1 })).to.equal(null);
  });
});
