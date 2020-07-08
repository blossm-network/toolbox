const deps = require("./deps");

module.exports = ({ getProofFn, updateProofFn }) => async (req, res) => {
  const storedProof = await getProofFn(req.params.id);

  if (!storedProof)
    throw deps.resourceNotFoundError.message("This proof wasn't found.");

  const proof = await deps.getProof({
    id: req.params.id,
    uri: storedProof.uri,
  });

  if (!proof) return res.status(204).send();

  await updateProofFn({
    id: req.params.id,
    update: proof,
  });

  res.send();
};
