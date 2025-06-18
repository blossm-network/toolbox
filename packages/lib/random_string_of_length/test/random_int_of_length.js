import * as chai from "chai";
import randomStringOfLength from "../index.js";

const { expect } = chai;

describe("Random", () => {
  it("should return a string of the specified length", () => {
    const length = 5;
    for (let i = 0; i < 100; i++) {
      const random = randomStringOfLength(length);
      expect(random).to.be.a("string");
      expect(random).to.have.length(length);
    }
  });
});
