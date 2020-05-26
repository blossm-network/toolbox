const deps = require("./deps");

module.exports = ({ countsStore }) => async ({ root }) => {
  const [{ count } = { count: -1 }] = await deps.db.find({
    store: countsStore,
    query: { root },
    options: { lean: true },
  });

  return count;
};
