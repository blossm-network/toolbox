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

  console.log({
    blockHeaders: block.headers,
    blockLimit,
  });

  //Create another block if there are outstanding snapshots to secure.
  if (block.headers.sCount >= blockLimit - 1) await createBlockFn();

  console.log("BLAHHH");

  res.send(block);
};
