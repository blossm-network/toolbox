import deps from "./deps.js";

export default ({ countsStore }) =>
  async ({ root, transaction }) => {
    const [{ value } = { value: 0 }] = await deps.db.find({
      store: countsStore,
      query: { root },
      transaction,
    });

    return value;
  };
