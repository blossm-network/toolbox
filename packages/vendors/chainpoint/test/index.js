const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake, replace } = require("sinon");
const { submitHashes } = require("../index");

const deps = require("../deps");
describe("Chainpoint", () => {
  afterEach(() => {
    restore();
  });
  it("it should submit hashes correctly", async () => {
    const hash1 = "some-hash1";
    const hash2 = "some-hash2";
    const hashId1 = "some-hash-id1";
    const hashId2 = "some-hash-id2";
    const uri1 = "some-hash-uri1";
    const uri2 = "some-hash-uri2";
    const submitHashesFake = fake.returns([
      { hash: hash2, hashId: hashId2, uri: uri2 },
      { hash: hash1, hashId: hashId1, uri: uri1 },
      { hash: "bogus", hashId: "bogus", uri: "bogus" },
    ]);
    replace(deps, "chainpoint", {
      submitHashes: submitHashesFake,
    });
    const hashes = [hash1, hash2];
    const result = await submitHashes(hashes);

    expect(result).to.deep.equal([
      { id: hashId1, uri: uri1 },
      { id: hashId2, uri: uri2 },
    ]);
    expect(submitHashesFake).to.have.been.calledWith(hashes);
  });
});
