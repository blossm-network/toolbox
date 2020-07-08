const deps = require("./deps");
exports.submitHash = async (hash) => {
  const submittedHashes = await deps.chainpoint.submitHashes([hash]);
  return submittedHashes
    .filter((submittedHash) => submittedHash.hash == hash)
    .map((submittedHash) => {
      return { id: submittedHash.proofId, uri: submittedHash.uri };
    });
};
exports.getProof = async ({ id, uri }) => {
  const [result] = await deps.chainpoint.getProofs([{ proofId: id, uri }]);
  if (!result || id != result.proofId) return null;
  return {
    value: result.proof,
    anchorsComplete: result.anchorsComplete,
  };
};

// exports.getProofs = deps.chainpoint.getProofs;
// exports.verifyProofs = deps.chainpoint.verifyProofs;
