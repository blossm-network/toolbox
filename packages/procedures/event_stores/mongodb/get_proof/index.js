const deps = require("./deps");

module.exports = ({ proofsStore }) => async (id) => {
  const [proof] = await deps.db.find({
    store: proofsStore,
    query: { id },
    options: { lean: true },
  });

  return proof;
};
