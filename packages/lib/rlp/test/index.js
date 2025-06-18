import * as chai from "chai";
import { encode, decode } from "../index.js";

const { expect } = chai;

describe("Rlp", () => {
  it("it should create a unique hash", async () => {
    const nestedList = [[], "asdf", [[]], [[], [[]]]];
    const encoded = encode(nestedList);
    const decoded = decode(encoded);
    const expectedList = [[], Buffer.from("asdf"), [[]], [[], [[]]]];
    expect(expectedList).to.deep.equal(decoded);
  });
});
