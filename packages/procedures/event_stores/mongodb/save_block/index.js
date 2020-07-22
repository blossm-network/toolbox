const deps = require("./deps");

module.exports = ({ blockchainStore }) => async ({ block, transaction }) => {
  const [result] = await deps.db.create({
    store: blockchainStore,
    data: block,
    ...(transaction && { options: { session: transaction } }),
  });
  return result;
};
