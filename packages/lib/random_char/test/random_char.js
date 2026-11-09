import * as chai from "chai";
import { randomInt as nativeRandomInt } from "crypto";
import deps from "../deps.js";
import randomChar from "../index.js";

const { expect } = chai;

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

describe("Secure random characters", () => {
  it("uses native crypto randomness with the correct bounds", () => {
    expect(deps.randomInt).to.equal(nativeRandomInt);
    const original = deps.randomInt;
    let bounds;
    deps.randomInt = (...args) => {
      bounds = args;
      return 4;
    };
    try {
      expect(randomChar()).to.equal(characters.charAt(4));
      expect(bounds).to.deep.equal([characters.length]);
    } finally {
      deps.randomInt = original;
    }
  });
});
