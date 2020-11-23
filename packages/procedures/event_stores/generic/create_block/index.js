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
  createBlockFn,
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
      createBlockFn,
      public,
    })
  );

  res.send(block);
};
