const deps = require("./deps");

module.exports = ({
  saveSnapshotFn,
  rootStreamFn,
  latestBlockFn,
  saveBlockFn,
  createTransactionFn,
  encryptFn,
  signFn,
  blockPublisherPublicKeyFn,
  findOneSnapshotFn,
  eventStreamFn,
  handlers,
  public,
}) => async (_, res) => {
  const block = await createTransactionFn(
    deps.createBlockTransaction({
      saveSnapshotFn,
      rootStreamFn,
      latestBlockFn,
      saveBlockFn,
      encryptFn,
      signFn,
      findOneSnapshotFn,
      eventStreamFn,
      handlers,
      blockPublisherPublicKeyFn,
      public,
    })
  );

  res.send(block);
};
