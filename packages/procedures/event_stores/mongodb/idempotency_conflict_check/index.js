const deps = require("./deps");

module.exports = ({ eventStore }) => async (idempotency) => {
  const [conflict] = await deps.db.find({
    store: eventStore,
    query: { "data.headers.idempotency": idempotency },
    limit: 1,
    select: { root: 1 },
    options: { lean: true },
  });

  return conflict != undefined;
};
