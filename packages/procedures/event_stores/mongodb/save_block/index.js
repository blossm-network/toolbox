const deps = require("./deps");

module.exports = ({ blockchainStore }) => async ({ block, transaction }) => {
  const [result] = await deps.db.write({
    store: blockchainStore,
    query: {
      hash: block.hash,
    },
    update: block,
    options: {
      lean: true,
      ...(transaction && { session: transaction }),
    },
  });
  return result;
};
