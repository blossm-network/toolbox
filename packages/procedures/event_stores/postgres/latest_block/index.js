import deps from "./deps.js";

export default ({ blockchainStore }) =>
  async ({ transaction } = {}) => {
    const [block = null] = await deps.db.find({
      store: blockchainStore,
      query: {},
      sort: { "headers.number": -1 },
      limit: 1,
      transaction,
    });

    return block;
  };
