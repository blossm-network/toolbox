const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake, replace } = require("sinon");
const { submitHash, getProof } = require("../index");

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
    const result = await submitHash(hash);

    expect(result).to.deep.equal([
      { id: proofId1, uri: uri1 },
      { id: proofId2, uri: uri2 },
      { id: proofId3, uri: uri3 },
    ]);
    expect(submitHashesFake).to.have.been.calledWith([hash]);
  });
  it("it should get proof correctly", async () => {
    const id = "some-id";
    const uri = "some-uri";
    const proof = { id, uri };
    const anchorsComplete = "some-anchors-complete";
    const getProofsFake = fake.returns([
      { proofId: id, proof, anchorsComplete },
    ]);
    replace(deps, "chainpoint", {
      getProofs: getProofsFake,
    });
    const result = await getProof(proof);

    expect(getProofsFake).to.have.been.calledWith([{ proofId: id, uri }]);
    expect(result).to.deep.equal({
      value: proof,
      anchorsComplete,
    });
  });
  it("it should get proof correctly if no result", async () => {
    const id = "some-id";
    const uri = "some-uri";
    const proof = { id, uri };
    const getProofsFake = fake.returns([]);
    replace(deps, "chainpoint", {
      getProofs: getProofsFake,
    });
    const result = await getProof(proof);

    expect(getProofsFake).to.have.been.calledWith([{ proofId: id, uri }]);
    expect(result).to.be.null;
  });
  it("it should get proof correctly if different id", async () => {
    const id = "some-id";
    const uri = "some-uri";
    const proof = { id, uri };
    const proofId = "some-proof-id";
    const anchorsComplete = "some-anchors-complete";
    const getProofsFake = fake.returns([{ proofId, proof, anchorsComplete }]);
    replace(deps, "chainpoint", {
      getProofs: getProofsFake,
    });
    const result = await getProof(proof);

    expect(getProofsFake).to.have.been.calledWith([{ proofId: id, uri }]);
    expect(result).to.be.null;
  });
});
