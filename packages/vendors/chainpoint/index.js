const deps = require("./deps");
exports.submitHashes = async (hash) => {
  //TODO
  //eslint-disable-next-line no-console
  console.log({ hash });
  const submittedHashes = await deps.chainpoint.submitHashes([hash]);
  //TODO
  //eslint-disable-next-line no-console
  console.log({ submittedHashes });
  return submittedHashes
    .filter((submittedHash) => submittedHash.hash == hash)
    .map((submittedHash) => {
      return { id: submittedHash.proofId, uri: submittedHash.uri };
    });
};
// exports.getProofs = deps.chainpoint.getProofs;
// exports.verifyProofs = deps.chainpoint.verifyProofs;
