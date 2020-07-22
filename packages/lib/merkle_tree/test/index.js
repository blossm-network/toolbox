const crypto = require("crypto");
const { expect } = require("chai");
const { root: merkleRoot, verify } = require("..");

const hashFn = (data) => crypto.createHash("sha256").update(data).digest();

describe("Merkle tree", () => {
  it("should return root correctly", () => {
    const data = ["a", "b", "c"];
    const root = merkleRoot({ data, hashFn });
    const verified = verify({ element: "a", data, root, hashFn });
    expect(verified).to.be.true;
    const bad = verify({ element: "d", data, root, hashFn });
    expect(bad).to.be.false;
  });
});
