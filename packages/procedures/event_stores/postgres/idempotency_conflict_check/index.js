import deps from "./deps.js";

export default ({ eventStore }) =>
  async (idempotency) => {
    const [conflict] = await deps.db.find({
      store: eventStore,
      query: { "headers.idempotency": idempotency },
      limit: 1,
    });

    return conflict != undefined;
  };
