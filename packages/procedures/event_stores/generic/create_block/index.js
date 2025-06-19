import deps from "./deps.js";

const blockLimit = 100;

export default ({
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
  isPublic,
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
      isPublic,
      blockLimit,
    })
  );

  //Create another block if the one just created was full.
  if (full) await createBlockFn();

  res.send(block);
};
