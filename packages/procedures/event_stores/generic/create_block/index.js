const deps = require("./deps");

module.exports = ({
  saveSnapshotFn,
  aggregateFn,
  rootStreamFn,
  latestBlockFn,
  saveBlockFn,
  createTransactionFn,
  encryptFn,
  signFn,
  blockPublisherPublicKeyFn,
  public,
}) => async (_, res) => {
  const block = await createTransactionFn(
    deps.createBlockTransaction({
      saveSnapshotFn,
      aggregateFn,
      rootStreamFn,
      latestBlockFn,
      saveBlockFn,
      encryptFn,
      signFn,
      blockPublisherPublicKeyFn,
      public,
    })
  );

  //TODO
  console.log({ block1: block });
  res.send(block);
};
