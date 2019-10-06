const { expect } = require("chai");
const arrayIntersection = require("..");

describe("Intersection", () => {
  it("should return the common items if one exist", () => {
    const common = "common";
    const array1 = [common, 23, 1, "pizza"];
    const array2 = [21, 3, common, "spinach"];

    const intersection = arrayIntersection(array1, array2);
    expect(intersection).to.be.of.length(1);
    expect(intersection[0]).to.equal(common);
  });
  it("should return the common items if multiple exist", () => {
    const common = "common";
    const common2 = 43;
    const array1 = [common, 23, common2, "pizza"];
    const array2 = [21, common2, common, "spinach"];
    const array3 = [11, common2, common, "tomatoes"];

    const intersection = arrayIntersection(array1, array2, array3);
    expect(intersection).to.be.of.length(2);
    expect(intersection).to.include(common);
    expect(intersection).to.include(common2);
  });
  it("should return an empty array if no common elements exist", () => {
    const array1 = ["pizza"];
    const array2 = ["spinach"];
    const array3 = ["tomatoes"];

    const intersection = arrayIntersection(array1, array2, array3);
    expect(intersection).to.be.of.length(0);
  });
});
