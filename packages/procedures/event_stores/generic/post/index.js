const deps = require("./deps");

module.exports = ({
  saveEventsFn,
  reserveRootCountsFn,
  publishFn,
  hashFn,
  proofsFn,
  saveProofsFn,
  scheduleUpdateForProofFn,
  createTransactionFn,
}) => async (req, res) => {
  const { events, proofs } = await createTransactionFn(
    deps.postTransaction({
      events: req.body.events,
      saveEventsFn,
      reserveRootCountsFn,
      hashFn,
      proofsFn,
      saveProofsFn,
    })
  );

  await Promise.all([
    ...events.map((e) => {
      return publishFn(
        {
          root: e.data.root,
        },
        e.data.headers.topic
      );
    }),
    ...proofs.map((proof) => scheduleUpdateForProofFn(proof.id)),
  ]);

  res.sendStatus(204);
};
