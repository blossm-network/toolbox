const deps = require("./deps");

module.exports = ({ eventStore }) => async (idempotency) => {
  const conflict = await deps.db.findOne({
    store: eventStore,
    query: { "headers.idempotency": idempotency },
    select: { "headers.root": 1 },
    options: { lean: true },
  });

  return conflict != undefined;
};
