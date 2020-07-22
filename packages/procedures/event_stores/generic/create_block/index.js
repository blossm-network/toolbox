const deps = require("./deps");

module.exports = ({
  saveSnapshotFn,
  aggregateFn,
  rootStreamFn,
  hashFn,
  latestBlockFn,
  saveBlockFn,
  createTransactionFn,
  public,
}) => async (_, res) => {
  await createTransactionFn(
    deps.createBlockTransaction({
      saveSnapshotFn,
      hashFn,
      aggregateFn,
      rootStreamFn,
      latestBlockFn,
      saveBlockFn,
      public,
    })
  );

  res.sendStatus(200);
};
