import * as chai from "chai";
import { root as merkleRoot, verify } from "../index.js";

const { expect } = chai;

describe("Merkle tree", () => {
  it("should return root correctly", async () => {
    const key = "a";
    const value = "b";
    const root = await merkleRoot([[key, value]]);
    const valid = await verify({
      pairs: [[key, value]],
      key,
      value,
      root,
    });
    expect(valid).to.be.true;
    const otherValid = await verify({
      pairs: [[Buffer.from(key), value]],
      key,
      value,
      root,
    });
    expect(otherValid).to.be.true;
    const badValue = await verify({
      pairs: [[key, value]],
      key,
      value: "d",
      root,
    });
    expect(badValue).to.be.false;
    const badKey = await verify({
      pairs: [[key, value]],
      key: "d",
      value,
      root,
    });
    expect(badKey).to.be.false;
  });
});
