const deps = require("./deps");
exports.submitHashes = async (hash) => {
  const submittedHashes = await deps.chainpoint.submitHashes([hash]);
  return submittedHashes
    .filter((submittedHash) => submittedHash.hash == hash)
    .map((submittedHash) => {
      return { id: submittedHash.proofId, uri: submittedHash.uri };
    });
};
// exports.getProofs = deps.chainpoint.getProofs;
// exports.verifyProofs = deps.chainpoint.verifyProofs;
