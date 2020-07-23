const { expect } = require("chai");

const { encode, decode } = require("..");

describe("Rlp", () => {
  it("it should create a unique hash", async () => {
    const nestedList = [[], "asdf", [[]], [[], [[]]]];
    const encoded = encode(nestedList);
    const decoded = decode(encoded);
    const expectedList = [[], Buffer.from("asdf"), [[]], [[], [[]]]];
    expect(expectedList).to.deep.equal(decoded);
  });
});
