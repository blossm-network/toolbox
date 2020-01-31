const { expect } = require("chai");
const arrayDifference = require("..");

describe("Difference", () => {
  it("should return the difference items if one exist", () => {
    const common = "common";
    const array1 = [common, 23, 1, "pizza"];
    const array2 = [21, 3, common, "spinach"];

    const difference = arrayDifference(array1, array2);
    expect(difference).to.be.of.length(3);
    expect(difference[0]).to.equal(23);
    expect(difference[1]).to.equal(1);
    expect(difference[2]).to.equal("pizza");
  });
  it("should return an empty array if no different elements exist", () => {
    const array1 = ["pizza"];
    const array2 = ["pizza"];
    const array3 = ["pizza"];

    const difference = arrayDifference(array1, array2, array3);
    expect(difference).to.be.of.length(0);
  });
});
