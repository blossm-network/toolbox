const deps = require("./deps");

module.exports = ({ eventStore }) => async (idempotency) => {
  const conflict = await deps.db.findOne({
    store: eventStore,
    query: { "data.idempotency": idempotency },
    select: { root: 1 },
    options: { lean: true },
  });

  return conflict != undefined;
};
