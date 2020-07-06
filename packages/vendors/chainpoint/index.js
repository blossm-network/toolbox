const deps = require("./deps");
exports.submitHashes = async (hashes) => {
  //TODO
  //eslint-disable-next-line no-console
  console.log({ hashes });
  const submittedHashes = await deps.chainpoint.submitHashes(hashes);
  //TODO
  //eslint-disable-next-line no-console
  console.log({ submittedHashes });
  return hashes.map((hash) => {
    const submittedHash = submittedHashes.find(
      (submittedHash) => submittedHash.hash == hash
    );
    return { id: submittedHash.proofId, uri: submittedHash.uri };
  });
};
// exports.getProofs = deps.chainpoint.getProofs;
// exports.verifyProofs = deps.chainpoint.verifyProofs;
