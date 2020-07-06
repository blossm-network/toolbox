const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake, replace } = require("sinon");
const { submitHashes } = require("../index");

const deps = require("../deps");
describe("Chainpoint", () => {
  afterEach(() => {
    restore();
  });
  it("it should submit hashes correctly", async () => {
    const hash = "some-hash";
    const proofId1 = "some-proof-id1";
    const proofId2 = "some-proof-id2";
    const proofId3 = "some-proof-id3";
    const uri1 = "some-hash-uri1";
    const uri2 = "some-hash-uri2";
    const uri3 = "some-hash-uri3";
    const submitHashesFake = fake.returns([
      { hash, proofId: proofId1, uri: uri1 },
      { hash, proofId: proofId2, uri: uri2 },
      { hash, proofId: proofId3, uri: uri3 },
      { hash: "bogus", proofId: "bogus", uri: "bogus" },
    ]);
    replace(deps, "chainpoint", {
      submitHashes: submitHashesFake,
    });
    const result = await submitHashes(hash);

    expect(result).to.deep.equal([
      { id: proofId1, uri: uri1 },
      { id: proofId2, uri: uri2 },
      { id: proofId3, uri: uri3 },
    ]);
    expect(submitHashesFake).to.have.been.calledWith([hash]);
  });
});
