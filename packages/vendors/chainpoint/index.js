const deps = require("./deps");
exports.submitHashes = async (hashes) => {
  const submittedHashes = await deps.chainpoint.submitHashes(hashes);
  return hashes.map((hash) => {
    const submittedHash = submittedHashes.find(
      (submittedHash) => submittedHash.hash == hash
    );
    return { id: submittedHash.hashId, uri: submittedHash.uri };
  });
};
// exports.getProofs = deps.chainpoint.getProofs;
// exports.verifyProofs = deps.chainpoint.verifyProofs;
