const { expect } = require("chai");
const stringify = require("..");

describe("Stringify object", () => {
  it("should return the correct values", () => {
    const obj1 = {
      a: 2,
      b: {
        c: 3,
        d: [4, 5, 6],
        e: {
          f: 7,
        },
      },
      g: [{ h: 8, i: 9 }, { j: 10 }, { k: 11 }],
    };
    const obj2 = {
      b: {
        c: 3,
        e: {
          f: 7,
        },
        d: [4, 5, 6],
      },
      g: [{ i: 9, h: 8 }, { j: 10 }, { k: 11 }],
      a: 2,
    };
    const string1 = stringify(obj1);
    const string2 = stringify(obj2);
    expect(string1).to.deep.equal(string2);
  });
});
