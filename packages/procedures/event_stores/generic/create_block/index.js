const deps = require("./deps");

const blockLimit = 100;

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
  const { block, full } = await createTransactionFn(
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
      blockLimit,
    })
  );

  //Create another block if the one just created was full.
  if (full) await createBlockFn();

  res.send(block);
};
