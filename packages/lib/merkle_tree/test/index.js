const { expect } = require("chai");
const { root: merkleRoot, verify } = require("..");

describe("Merkle tree", () => {
  it("should return root correctly", async () => {
    const key = "a";
    const value = "b";
    const root = await merkleRoot([{ key, value }]);
    const valid = await verify({
      pairs: [{ key, value }],
      key,
      value,
      root,
    });
    expect(valid).to.be.true;
    const badValue = await verify({
      pairs: [{ key, value }],
      key,
      value: "d",
      root,
    });
    expect(badValue).to.be.false;
    const badKey = await verify({
      pairs: [{ key, value }],
      key: "d",
      value,
      root,
    });
    expect(badKey).to.be.false;
  });
});
