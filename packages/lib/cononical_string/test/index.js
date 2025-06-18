import { expect } from "chai";
import canonicalJson from "../index.js";

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
      h: canonicalJson({ o: 9 }),
    };
    const obj2 = {
      b: {
        c: 3,
        e: {
          f: 7,
        },
        d: [4, 5, 6],
      },
      h: canonicalJson({ o: 9 }),
      g: [{ i: 9, h: 8 }, { j: 10 }, { k: 11 }],
      a: 2,
    };
    const obj3 = ["some", "object"];
    const string1 = canonicalJson(obj1);
    const string2 = canonicalJson(obj2);
    const string3 = canonicalJson(obj3);
    expect(string1).to.deep.equal(string2);
    expect(string3).to.deep.equal(string3);
  });
});
