import deps from "./deps.js";

export default ({ blockchainStore }) => ({ block, transaction }) =>
  deps.db.write({
    store: blockchainStore,
    query: {
      hash: block.hash,
    },
    update: block,
    options: {
      lean: true,
      omitUndefined: true,
      upsert: true,
      returnDocument: "after",
      runValidators: true,
      ...(transaction && { session: transaction }),
    },
  });
