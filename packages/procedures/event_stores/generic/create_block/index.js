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
      blockLimit,
    })
  );

  //Create another block if the.
  if (block.headers.sCount > 0) await createBlockFn();

  res.send(block);
};
