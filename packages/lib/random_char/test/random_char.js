import * as chai from "chai";
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
