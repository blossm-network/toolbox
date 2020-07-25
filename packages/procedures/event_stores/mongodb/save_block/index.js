const deps = require("./deps");

module.exports = ({ blockchainStore }) => async ({ block, transaction }) => {
  const [result] = await deps.db.create({
    store: blockchainStore,
    data: block,
    options: {
      lean: true,
      ...(transaction && { session: transaction }),
    },
  });
  return result;
};
